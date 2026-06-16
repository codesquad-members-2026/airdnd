import { useState } from 'react';
import { won } from '../../shared/utils';
import type { SearchState } from '../../types';

const BARS = [12, 20, 32, 46, 60, 78, 64, 50, 70, 40, 30, 22, 16, 26, 18, 10];

interface PricePanelProps {
  value: SearchState;
  onChange: (v: SearchState) => void;
}

export function PricePanel({ value, onChange }: PricePanelProps) {
  const [v, setV] = useState(value.price ?? 500000);

  function handleChange(next: number) {
    setV(next);
    onChange({ ...value, price: next, priceLabel: `₩100,000~${won(next)}` });
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>가격 범위</div>
      <div style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 18 }}>
        1박 요금 · 수수료 포함 전
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          height: 80,
          marginBottom: 10,
        }}
      >
        {BARS.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: h,
              borderRadius: 2,
              background:
                (i / BARS.length) * 1000000 <= v
                  ? 'var(--brand-coral)'
                  : 'var(--line-strong)',
            }}
          />
        ))}
      </div>
      <input
        type="range"
        min={100000}
        max={1000000}
        step={10000}
        value={v}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="price-range"
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <PriceBox label="최저" val="₩100,000" />
        <PriceBox label="최고" val={won(v)} />
      </div>
    </div>
  );
}

function PriceBox({ label, val }: { label: string; val: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--line-strong)',
        borderRadius: 30,
        padding: '10px 20px',
        minWidth: 150,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500 }}>{val}</div>
    </div>
  );
}
