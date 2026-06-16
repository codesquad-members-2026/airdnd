import { useState, useRef, useEffect } from 'react';
import { Icon } from '../shared/Icon';
import { CalendarModal } from './panels/CalendarModal';
import { PricePanel } from './panels/PricePanel';
import { GuestPanel } from './panels/GuestPanel';
import type { SearchState } from '../types';

type Segment = 'date' | 'price' | 'guest' | null;

interface SearchBarProps {
  value: SearchState;
  onChange: (v: SearchState) => void;
  onSearch: () => void;
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const [active, setActive] = useState<Segment>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setActive(null);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function toggle(key: Segment) {
    setActive(active === key ? null : key);
  }

  const checkin = value.dates ? value.dates.split(' – ')[0] : '';
  const checkout = value.dates ? value.dates.split(' – ')[1] : '';

  return (
    <div ref={ref} style={{ position: 'relative', width: 916, maxWidth: '92vw' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 76,
          background: '#fff',
          border: '1px solid var(--line-strong)',
          borderRadius: 60,
          boxShadow: 'var(--shadow-pop)',
        }}
      >
        {/* 체크인 + 체크아웃: 하나의 덩어리로 클릭 */}
        <div
          onClick={() => toggle('date')}
          style={{
            flex: 2,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 60,
            background: active === 'date' ? 'var(--surface-alt-2)' : 'transparent',
            transition: 'background 120ms ease',
            cursor: 'pointer',
          }}
        >
          <div style={{ flex: 1, padding: '0 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-strong)' }}>체크인</span>
            <span style={{ fontSize: 15, color: checkin ? 'var(--ink-1)' : 'var(--ink-3)' }}>
              {checkin || '날짜 입력'}
            </span>
          </div>
          <Sep />
          <div style={{ flex: 1, padding: '0 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-strong)' }}>체크아웃</span>
            <span style={{ fontSize: 15, color: checkout ? 'var(--ink-1)' : 'var(--ink-3)' }}>
              {checkout || '날짜 입력'}
            </span>
          </div>
        </div>
        <Sep />
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <Segment
            label="요금"
            val={value.priceLabel}
            placeholder="금액대 설정"
            active={active === 'price'}
            onClick={() => toggle('price')}
            noFlex
          />
          {active === 'price' && (
            <Popover width={420} centerUnder>
              <PricePanel value={value} onChange={onChange} />
            </Popover>
          )}
        </div>
        <Sep />
        <Segment
          label="인원"
          val={value.guestLabel}
          placeholder="게스트 추가"
          active={active === 'guest'}
          onClick={() => toggle('guest')}
        />
        <button
          onClick={onSearch}
          style={{
            margin: '0 10px 0 4px',
            flex: 'none',
            border: 'none',
            cursor: 'pointer',
            height: 48,
            padding: value.dates ? '0 22px 0 16px' : 0,
            width: value.dates ? 'auto' : 48,
            borderRadius: 60,
            background: 'var(--brand-coral)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 15,
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-coral-press)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-coral)';
          }}
        >
          <Icon name="search" size={20} color="#fff" />
          {value.dates && '검색'}
        </button>
      </div>

      {active === 'date' && (
        <Popover>
          <CalendarModal value={value} onChange={onChange} />
        </Popover>
      )}
      {active === 'guest' && (
        <Popover width={420} right>
          <GuestPanel value={value} onChange={onChange} />
        </Popover>
      )}
    </div>
  );
}

function Segment({
  label,
  val,
  placeholder,
  active,
  onClick,
  noFlex,
}: {
  label: string;
  val: string;
  placeholder: string;
  active: boolean;
  onClick: () => void;
  noFlex?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: noFlex ? 'none' : 1,
        width: noFlex ? '100%' : undefined,
        padding: '0 26px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
        position: 'relative',
        cursor: 'pointer',
        borderRadius: 60,
        background: active ? 'var(--surface-alt-2)' : 'transparent',
        transition: 'background 120ms ease',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-strong)' }}>{label}</span>
      <span style={{ fontSize: 15, color: val ? 'var(--ink-1)' : 'var(--ink-3)' }}>
        {val || placeholder}
      </span>
    </div>
  );
}

function Sep() {
  return (
    <span style={{ width: 1, height: 40, background: 'var(--line)', flexShrink: 0 }} />
  );
}

function Popover({
  children,
  width,
  right,
  centerUnder,
}: {
  children: React.ReactNode;
  width?: number;
  right?: boolean;
  centerUnder?: boolean;
}) {
  return (
    <div
      className="popover-enter"
      style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        left: centerUnder ? '25%' : right ? 'auto' : 0,
        right: right ? 0 : 'auto',
        transform: centerUnder ? 'translateX(-50%)' : 'none',
        width: width ?? '100%',
        background: '#fff',
        borderRadius: 32,
        boxShadow: 'var(--shadow-pop)',
        padding: 32,
        zIndex: 50,
      }}
    >
      {children}
    </div>
  );
}
