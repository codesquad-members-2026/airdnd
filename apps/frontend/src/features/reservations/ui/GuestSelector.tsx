import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { CreateReservationFormValues } from '../model/reservationTypes';

interface GuestSelectorProps {
  maxGuests: number;
  allowsPets: boolean;
  setValue: UseFormSetValue<CreateReservationFormValues>;
  watch: UseFormWatch<CreateReservationFormValues>;
}

export function GuestSelector({ maxGuests, allowsPets, setValue, watch }: GuestSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const adults = watch('adults') as number || 1;
  const children = watch('children') as number || 0;
  const infants = watch('infants') as number || 0;
  const pets = watch('pets') as number || 0;

  const totalGuests = adults + children;

  // Handle outside click to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIncrement = (type: 'adults' | 'children' | 'infants' | 'pets') => {
    if (type === 'adults' || type === 'children') {
      if (totalGuests < maxGuests) {
        setValue(type, (watch(type) as number || 0) + 1, { shouldValidate: true });
      }
    } else if (type === 'pets' && allowsPets) {
      setValue(type, pets + 1, { shouldValidate: true });
    } else if (type === 'infants') {
      // Typically infants don't count towards maxGuests in Airbnb, usually max 5
      if (infants < 5) {
        setValue(type, infants + 1, { shouldValidate: true });
      }
    }
  };

  const handleDecrement = (type: 'adults' | 'children' | 'infants' | 'pets') => {
    const currentValue = watch(type) as number || 0;
    if (type === 'adults' && currentValue > 1) {
      setValue(type, currentValue - 1, { shouldValidate: true });
    } else if (type !== 'adults' && currentValue > 0) {
      setValue(type, currentValue - 1, { shouldValidate: true });
    }
  };

  const formatSummary = () => {
    let summary = `게스트 ${totalGuests}명`;
    if (infants > 0) summary += `, 유아 ${infants}명`;
    if (pets > 0) summary += `, 반려동물 ${pets}마리`;
    return summary;
  };

  return (
    <div className="guest-selector-container" ref={containerRef} style={{ position: 'relative' }}>
      <label>인원</label>
      <button
        type="button"
        className="guest-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          background: 'white',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span>{formatSummary()}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div 
          className="guest-selector-popover" 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10
          }}
        >
          <div className="guest-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>성인</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>13세 이상</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="button" onClick={() => handleDecrement('adults')} disabled={adults <= 1} style={btnStyle(adults <= 1)}><Minus size={16} /></button>
              <span style={{ width: '20px', textAlign: 'center' }}>{adults}</span>
              <button type="button" onClick={() => handleIncrement('adults')} disabled={totalGuests >= maxGuests} style={btnStyle(totalGuests >= maxGuests)}><Plus size={16} /></button>
            </div>
          </div>

          <div className="guest-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>어린이</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>2~12세</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="button" onClick={() => handleDecrement('children')} disabled={children <= 0} style={btnStyle(children <= 0)}><Minus size={16} /></button>
              <span style={{ width: '20px', textAlign: 'center' }}>{children}</span>
              <button type="button" onClick={() => handleIncrement('children')} disabled={totalGuests >= maxGuests} style={btnStyle(totalGuests >= maxGuests)}><Plus size={16} /></button>
            </div>
          </div>

          <div className="guest-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>유아</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>2세 미만</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="button" onClick={() => handleDecrement('infants')} disabled={infants <= 0} style={btnStyle(infants <= 0)}><Minus size={16} /></button>
              <span style={{ width: '20px', textAlign: 'center' }}>{infants}</span>
              <button type="button" onClick={() => handleIncrement('infants')} disabled={infants >= 5} style={btnStyle(infants >= 5)}><Plus size={16} /></button>
            </div>
          </div>

          <div className="guest-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>반려동물</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                {allowsPets ? '보조동물을 동반하시나요?' : '반려동물 동반 불가'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="button" onClick={() => handleDecrement('pets')} disabled={pets <= 0} style={btnStyle(pets <= 0)}><Minus size={16} /></button>
              <span style={{ width: '20px', textAlign: 'center' }}>{pets}</span>
              <button type="button" onClick={() => handleIncrement('pets')} disabled={!allowsPets || pets >= 5} style={btnStyle(!allowsPets || pets >= 5)}><Plus size={16} /></button>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
            이 숙소의 최대 숙박 인원은 {maxGuests}명입니다.
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(disabled: boolean) {
  return {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: `1px solid ${disabled ? '#eee' : '#666'}`,
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#eee' : '#666',
  };
}
