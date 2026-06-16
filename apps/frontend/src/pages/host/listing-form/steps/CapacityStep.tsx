import { Icon } from '../../../../shared/Icon';
import type { ListingFormData } from '../../../../types';
import type { SetListingFormValue } from '../types';

const ROWS: { key: keyof ListingFormData; label: string; min: number; max: number }[] = [
  { key: 'maxGuests', label: '최대 인원', min: 1, max: 20 },
  { key: 'bedrooms', label: '침실', min: 0, max: 20 },
  { key: 'beds', label: '침대', min: 1, max: 20 },
  { key: 'bathrooms', label: '욕실', min: 1, max: 20 },
];

export function CapacityStep({
  form,
  setField,
}: {
  form: ListingFormData;
  setField: SetListingFormValue;
}) {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, marginBottom: 8 }}>
        기본 정보부터 시작해요
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 28 }}>
        여기에 몇 명이 머물 수 있나요?
      </p>

      <div>
        {ROWS.map((row, i) => (
          <CounterRow
            key={row.key}
            label={row.label}
            value={form[row.key] as number}
            min={row.min}
            max={row.max}
            onChange={v => setField(row.key, v as never)}
            divider={i < ROWS.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function CounterRow({
  label,
  value,
  min,
  max,
  onChange,
  divider,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  divider: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 0',
        borderBottom: divider ? '1px solid var(--line)' : 'none',
      }}
    >
      <span style={{ fontSize: 18 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <RoundButton disabled={value <= min} onClick={() => onChange(value - 1)} icon="minus" />
        <span style={{ minWidth: 24, textAlign: 'center', fontSize: 16, fontWeight: 600 }}>{value}</span>
        <RoundButton disabled={value >= max} onClick={() => onChange(value + 1)} icon="plus" />
      </div>
    </div>
  );
}

function RoundButton({ icon, disabled, onClick }: { icon: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: `1px solid ${disabled ? 'var(--line)' : 'var(--line-strong)'}`,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon name={icon} size={16} color="var(--ink-1)" />
    </button>
  );
}
