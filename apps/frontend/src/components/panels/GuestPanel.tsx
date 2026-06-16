import { useState } from 'react';
import { Icon } from '../../shared/Icon';
import type { SearchState, GuestCounts } from '../../types';

const ROWS: [keyof GuestCounts, string, string][] = [
  ['adult', '성인', '만 13세 이상'],
  ['child', '어린이', '만 2~12세'],
  ['infant', '유아', '만 2세 미만'],
  ['pet', '반려동물', '보조동물을 동반하시나요?'],
];

interface GuestPanelProps {
  value: SearchState;
  onChange: (v: SearchState) => void;
}

export function GuestPanel({ value, onChange }: GuestPanelProps) {
  const [g, setG] = useState<GuestCounts>(
    value.guests ?? { adult: 1, child: 0, infant: 0, pet: 0 }
  );

  function adjust(key: keyof GuestCounts, delta: number) {
    const next = { ...g, [key]: Math.max(0, g[key] + delta) };
    if (key === 'adult') next.adult = Math.max(1, next.adult);
    setG(next);
    const total = next.adult + next.child;
    const label =
      total > 0
        ? `게스트 ${total}명${next.infant ? `, 유아 ${next.infant}명` : ''}${next.pet ? `, 반려동물 ${next.pet}마리` : ''}`
        : '게스트 추가';
    onChange({ ...value, guests: next, guestLabel: label });
  }

  return (
    <div>
      {ROWS.map(([k, title, sub], i) => (
        <div
          key={k}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 0',
            borderTop: i ? '1px solid var(--line)' : 'none',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>{sub}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <RoundBtn
              icon="minus"
              onClick={() => adjust(k, -1)}
              disabled={k === 'adult' ? g[k] <= 1 : g[k] <= 0}
            />
            <span style={{ width: 20, textAlign: 'center', fontWeight: 700 }}>{g[k]}</span>
            <RoundBtn icon="plus" onClick={() => adjust(k, 1)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RoundBtn({
  icon,
  onClick,
  disabled,
}: {
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: '#fff',
        border: '1px solid var(--ink-4)',
        color: 'var(--ink-2)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 120ms ease',
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
