import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { CreateReservationFormValues } from '../model/reservationTypes';

interface GuestSelectorProps {
  maxGuests: number;
  allowsPets: boolean;
  allowsInfants: boolean;
  setValue: UseFormSetValue<CreateReservationFormValues>;
  watch: UseFormWatch<CreateReservationFormValues>;
}

type GuestType = 'adults' | 'children' | 'infants' | 'pets';

export function GuestSelector({
  maxGuests,
  allowsPets,
  allowsInfants,
  setValue,
  watch,
}: GuestSelectorProps) {
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

  const handleIncrement = (type: GuestType) => {
    if (type === 'adults' || type === 'children') {
      if (totalGuests < maxGuests) {
        setValue(type, (watch(type) as number || 0) + 1, { shouldValidate: true });
      }
    } else if (type === 'pets' && allowsPets) {
      setValue(type, pets + 1, { shouldValidate: true });
    } else if (type === 'infants' && allowsInfants) {
      // Typically infants don't count towards maxGuests in Airbnb, usually max 5
      if (infants < 5) {
        setValue(type, infants + 1, { shouldValidate: true });
      }
    }
  };

  const handleDecrement = (type: GuestType) => {
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

  const rows: {
    type: GuestType;
    title: string;
    hint: string;
    value: number;
    decDisabled: boolean;
    incDisabled: boolean;
  }[] = [
    { type: 'adults', title: '성인', hint: '13세 이상', value: adults, decDisabled: adults <= 1, incDisabled: totalGuests >= maxGuests },
    { type: 'children', title: '어린이', hint: '2~12세', value: children, decDisabled: children <= 0, incDisabled: totalGuests >= maxGuests },
    {
      type: 'infants',
      title: '유아',
      hint: allowsInfants ? '2세 미만' : '유아 동반 불가',
      value: infants,
      decDisabled: infants <= 0,
      incDisabled: !allowsInfants || infants >= 5,
    },
    {
      type: 'pets',
      title: '반려동물',
      hint: allowsPets ? '보조동물을 동반하시나요?' : '반려동물 동반 불가',
      value: pets,
      decDisabled: pets <= 0,
      incDisabled: !allowsPets || pets >= 5,
    },
  ];

  return (
    <div className="guest-selector-container" ref={containerRef}>
      <button type="button" className="guest-selector-button" onClick={() => setIsOpen(!isOpen)}>
        <span className="guest-selector-label">인원</span>
        <span className="guest-selector-summary">
          {formatSummary()}
          <ChevronDown size={16} />
        </span>
      </button>

      {isOpen && (
        <div className="guest-selector-popover">
          <div className="guest-rows">
            {rows.map((row) => (
              <div className="guest-row" key={row.type}>
                <div>
                  <div className="guest-row__title">{row.title}</div>
                  <div className="guest-row__hint">{row.hint}</div>
                </div>
                <div className="guest-stepper">
                  <button
                    type="button"
                    className="guest-stepper__btn"
                    onClick={() => handleDecrement(row.type)}
                    disabled={row.decDisabled}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="guest-stepper__count">{row.value}</span>
                  <button
                    type="button"
                    className="guest-stepper__btn"
                    onClick={() => handleIncrement(row.type)}
                    disabled={row.incDisabled}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="guest-selector-note">
            이 숙소의 최대 숙박 인원은 {maxGuests}명입니다.
          </div>
        </div>
      )}
    </div>
  );
}
