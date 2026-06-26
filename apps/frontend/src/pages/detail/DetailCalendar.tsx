import { useState, useRef, useEffect } from 'react';
import { CalendarModal } from '../../components/panels/CalendarModal';
import type { SearchState } from '../../types';

interface DetailCalendarProps {
  value: SearchState;
  onChange: (v: SearchState) => void;
  location: string;
}

function nightsBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

// 레퍼런스: "N박 in 지역" + 2개월 달력. 우측 예약 카드와 동일 search 상태라 자동 동기화
export function DetailCalendar({ value, onChange, location }: DetailCalendarProps) {
  const nights = nightsBetween(value.range?.a ?? null, value.range?.b ?? null);

  // 외부(우측 예약카드)에서 날짜가 바뀐 경우에만 remount해 동기화.
  // 자기 달력 선택은 remount 안 함 → 월 이동 상태 유지(점프 버그 방지)
  const [syncKey, setSyncKey] = useState(0);
  const selfChange = useRef(false);
  useEffect(() => {
    if (selfChange.current) {
      selfChange.current = false;
      return;
    }
    setSyncKey(k => k + 1);
  }, [value.dates]);
  const handleChange = (v: SearchState) => {
    selfChange.current = true;
    onChange(v);
  };
  const clear = () => handleChange({ ...value, range: { a: null, b: null }, dates: '' });

  return (
    <div style={{ padding: '40px 0', borderTop: '1px solid var(--line)' }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
        {nights > 0 ? `${location}에서 ${nights}박` : '날짜를 선택하세요'}
      </h2>
      <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 20 }}>
        {value.dates || '여행 날짜를 추가하면 정확한 요금을 확인할 수 있어요'}
      </div>

      <CalendarModal key={syncKey} value={value} onChange={handleChange} />

      {value.dates && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            onClick={clear}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              color: 'var(--ink-1)',
            }}
          >
            날짜 지우기
          </button>
        </div>
      )}
    </div>
  );
}
