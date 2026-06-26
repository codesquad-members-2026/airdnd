import { won } from '../../shared/utils';
import type { SearchState } from '../../types';

const MIN = 30000;
const MAX = 1000000;
const STEP = 10000;
const BARS = [12, 18, 26, 40, 55, 70, 60, 78, 64, 50, 70, 44, 36, 28, 20, 14];

interface PricePanelProps {
  value: SearchState;
  onChange: (v: SearchState) => void;
}

// 최저/최고 듀얼 슬라이더. priceMin/priceMax는 미설정 시 양 끝(전체 범위)으로 표시
export function PricePanel({ value, onChange }: PricePanelProps) {
  const lo = value.priceMin ?? MIN;
  const hi = value.priceMax ?? MAX;

  const setLo = (n: number) => {
    const next = Math.min(n, hi - STEP);
    onChange({ ...value, priceMin: next <= MIN ? null : next });
  };
  const setHi = (n: number) => {
    const next = Math.max(n, lo + STEP);
    onChange({ ...value, priceMax: next >= MAX ? MAX : next });
  };

  const pct = (n: number) => ((n - MIN) / (MAX - MIN)) * 100;

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>가격 범위</div>
      <div style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 18 }}>
        1박 요금 · 수수료 포함 전
      </div>

      {/* 히스토그램 — 선택 범위 안의 막대만 강조 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, marginBottom: 8 }}>
        {BARS.map((h, i) => {
          const barPct = (i / (BARS.length - 1)) * 100;
          const inRange = barPct >= pct(lo) && barPct <= pct(hi);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: h,
                borderRadius: 2,
                background: inRange ? 'var(--brand-coral)' : 'var(--line-strong)',
              }}
            />
          );
        })}
      </div>

      {/* 듀얼 레인지 */}
      <div className="dual-range">
        {/* 선택 구간 강조 트랙 */}
        <div style={{ position: 'absolute', top: 9, left: 0, right: 0, height: 4, borderRadius: 2, background: 'var(--line-strong)' }} />
        <div
          style={{
            position: 'absolute',
            top: 9,
            height: 4,
            borderRadius: 2,
            background: 'var(--brand-coral)',
            left: `${pct(lo)}%`,
            right: `${100 - pct(hi)}%`,
          }}
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={lo}
          onChange={(e) => setLo(Number(e.target.value))}
          aria-label="최저 가격"
          style={{ zIndex: lo > MAX - STEP * 2 ? 5 : 3 }}
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={hi}
          onChange={(e) => setHi(Number(e.target.value))}
          aria-label="최고 가격"
          style={{ zIndex: 4 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <PriceBox label="최저" val={won(lo)} />
        <PriceBox label="최고" val={hi >= MAX ? `${won(MAX)}+` : won(hi)} />
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
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500 }}>{val}</div>
    </div>
  );
}
