import { useState, useEffect } from 'react';
import { Icon } from '../../shared/Icon';
import type { SearchState, DateRange } from '../../types';

const WD = ['일', '월', '화', '수', '목', '금', '토'];

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const TODAY_KEY = dateKey(TODAY.getFullYear(), TODAY.getMonth() + 1, TODAY.getDate());

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Month descriptor for the given offset from the current month
function monthAt(offset: number) {
  const base = new Date(TODAY.getFullYear(), TODAY.getMonth() + offset, 1);
  const y = base.getFullYear();
  const m = base.getMonth() + 1;
  return { y, m, first: base.getDay(), days: new Date(y, m, 0).getDate() };
}

interface CalendarModalProps {
  value: SearchState;
  onChange: (v: SearchState) => void;
  // 점유(예약)된 날짜 키 집합("YYYY-MM-DD"). 해당 박은 선택 불가
  blockedDates?: Set<string>;
  // 우측으로 페이지를 넘길 때 가장 멀리 본 월 오프셋을 알려 선요청을 트리거
  onReachOffset?: (maxOffset: number) => void;
}

export function CalendarModal({ value, onChange, blockedDates, onReachOffset }: CalendarModalProps) {
  const [range, setRange] = useState<DateRange>(value.range ?? { a: null, b: null });
  const [offset, setOffset] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  const months = [monthAt(offset), monthAt(offset + 1)];

  // 보이는 가장 먼 월(우측) 오프셋을 부모에 알려 다음 구간을 미리 받게 함
  useEffect(() => {
    onReachOffset?.(offset + 1);
  }, [offset, onReachOffset]);

  // [a, b) 사이(체크인~체크아웃 직전 박)에 점유일이 있으면 그 범위는 선택 불가
  const hasBlockedBetween = (a: string, b: string) => {
    if (!blockedDates || blockedDates.size === 0) return false;
    for (const k of blockedDates) if (k >= a && k < b) return true;
    return false;
  };

  // Tentative end date for the hover preview band (only while picking the second date).
  // 점유일을 가로지르는 미리보기는 막아 시각적으로도 선택 한계를 보여줌
  const previewEnd =
    range.a && !range.b && hover && hover > range.a && !hasBlockedBetween(range.a, hover)
      ? hover
      : null;

  function pick(key: string) {
    let next: DateRange;
    if (!range.a || (range.a && range.b)) {
      next = { a: key, b: null };
    } else if (key < range.a || hasBlockedBetween(range.a, key)) {
      // 시작 이전 클릭이거나 점유일을 가로지르면 새 시작점으로 리셋
      next = { a: key, b: null };
    } else {
      next = { a: range.a, b: key };
    }
    setRange(next);
    if (next.a && next.b) {
      const fmt = (k: string) => `${parseInt(k.split('-')[1])}월 ${parseInt(k.split('-')[2])}일`;
      onChange({ ...value, range: next, dates: `${fmt(next.a)} – ${fmt(next.b)}` });
    } else {
      onChange({ ...value, range: next, dates: '' });
    }
  }

  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
      <div style={{ display: 'flex', gap: 48, justifyContent: 'center' }}>
        <ChevronBtn dir="left" disabled={offset <= 0} onClick={() => setOffset((o) => Math.max(0, o - 1))} />
        {months.map((mo) => (
          <Month
            key={`${mo.y}-${mo.m}`}
            mo={mo}
            range={range}
            previewEnd={previewEnd}
            blockedDates={blockedDates}
            onPick={pick}
            onHover={setHover}
          />
        ))}
        <ChevronBtn dir="right" onClick={() => setOffset((o) => o + 1)} />
      </div>
    </div>
  );
}

function ChevronBtn({ dir, disabled, onClick }: { dir: 'left' | 'right'; disabled?: boolean; onClick: () => void }) {
  return (
    <div
      className="cal-chev"
      onClick={disabled ? undefined : onClick}
      style={{
        position: 'absolute',
        top: 0,
        [dir === 'left' ? 'left' : 'right']: -8,
        width: 36,
        height: 36,
        borderRadius: '50%',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 120ms ease',
      }}
    >
      <Icon
        name={dir === 'left' ? 'chevron-left' : 'chevron-right'}
        size={20}
        color="var(--ink-1)"
      />
    </div>
  );
}

interface MonthProps {
  mo: { y: number; m: number; first: number; days: number };
  range: DateRange;
  previewEnd: string | null;
  blockedDates?: Set<string>;
  onPick: (key: string) => void;
  onHover: (key: string | null) => void;
}

function Month({ mo, range, previewEnd, blockedDates, onPick, onHover }: MonthProps) {
  const cells: (number | null)[] = [];
  for (let i = 0; i < mo.first; i++) cells.push(null);
  for (let d = 1; d <= mo.days; d++) cells.push(d);

  // Zero-pad month and day so string comparison works correctly (e.g. "09" < "16")
  const key = (d: number) => dateKey(mo.y, mo.m, d);

  // Effective end: real second date, or hovered date while picking
  const effEnd = range.b ?? previewEnd;

  const isStart = (d: number) => key(d) === range.a;
  const isEnd   = (d: number) => key(d) === effEnd;
  const inRange = (d: number) => {
    if (!range.a || !effEnd) return false;
    const k = key(d);
    return k > range.a && k < effEnd;
  };
  // Disable any day before today
  const isPast = (d: number) => key(d) < TODAY_KEY;
  // 점유(예약)된 박 → 선택 불가
  const isBlocked = (d: number) => blockedDates?.has(key(d)) ?? false;

  return (
    <div style={{ width: 300 }}>
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>
        {mo.y}년 {mo.m}월
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {WD.map((w) => (
          <div
            key={w}
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--ink-3)',
              paddingBottom: 8,
            }}
          >
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} style={{ height: 42 }} />;
          const start    = isStart(d);
          const end      = isEnd(d);
          const endpoint = start || end;
          const rng      = inRange(d);
          const blocked  = isBlocked(d);
          const dis      = isPast(d) || blocked;

          // Band spans the full cell; half-band on start/end to cap the range strip neatly
          let bandBg = 'transparent';
          if (rng) {
            bandBg = 'var(--surface-alt-2)';
          } else if (start && effEnd) {
            // right half only (band extends rightward from start)
            bandBg = 'linear-gradient(to right, transparent 50%, var(--surface-alt-2) 50%)';
          } else if (end && range.a) {
            // left half only (band extends leftward to end)
            bandBg = 'linear-gradient(to left, transparent 50%, var(--surface-alt-2) 50%)';
          }

          return (
            <div
              key={i}
              onMouseEnter={() => !dis && onHover(key(d))}
              style={{
                height: 42,
                background: bandBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <button
                disabled={dis}
                onClick={() => onPick(key(d))}
                className="cal-day"
                style={{
                  width: 38,
                  height: 38,
                  border: 'none',
                  borderRadius: '50%',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: dis ? 'default' : 'pointer',
                  background: endpoint ? 'var(--selected)' : 'transparent',
                  color: dis ? 'var(--ink-4)' : endpoint ? '#fff' : 'var(--ink-1)',
                  // 점유일은 취소선으로 과거일과 구분
                  textDecoration: blocked ? 'line-through' : 'none',
                  transition: 'background 120ms ease',
                  position: 'relative',
                  zIndex: 1,
                  flexShrink: 0,
                }}
              >
                {d}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
