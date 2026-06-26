import { useState, useRef, useEffect } from 'react';
import { Icon } from '../shared/Icon';
import { CalendarModal } from './panels/CalendarModal';
import { GuestPanel } from './panels/GuestPanel';
import { DestinationPanel } from './panels/DestinationPanel';
import type { SearchState } from '../types';

export type SearchSegment = 'dest' | 'date' | 'guest';
type Segment = SearchSegment | null;

interface SearchBarProps {
  value: SearchState;
  onChange: (v: SearchState) => void;
  onSearch: () => void;
  // 부모가 폭을 제어(인라인 확장 애니메이션). 켜면 root가 100% 채움
  fluid?: boolean;
  // 마운트 시 바로 열어둘 세그먼트(pill 구역 클릭 → 해당 패널 열림)
  initialActive?: Segment;
}

export function SearchBar({ value, onChange, onSearch, fluid, initialActive = null }: SearchBarProps) {
  const [active, setActive] = useState<Segment>(initialActive);
  // 여행지 직접 타이핑 질의어(빈 값이면 주요 도시)
  const [destQuery, setDestQuery] = useState('');
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

  const [dateHover, setDateHover] = useState(false);
  const checkin = value.dates ? value.dates.split(' – ')[0] : '';
  const checkout = value.dates ? value.dates.split(' – ')[1] : '';

  return (
    <div
      ref={ref}
      style={fluid ? { position: 'relative', width: '100%' } : { position: 'relative', width: 916, maxWidth: '92vw' }}
    >
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
        {/* 여행지 — 직접 타이핑 검색 */}
        <div style={{ flex: 1.4, position: 'relative', height: '100%' }}>
          <DestField
            active={active === 'dest'}
            destination={value.destination}
            query={destQuery}
            onOpen={() => {
              setDestQuery('');
              setActive('dest');
            }}
            onQuery={setDestQuery}
            onClear={() => {
              setDestQuery('');
              onChange({ ...value, destination: '', region: null });
            }}
          />
          {active === 'dest' && (
            <Popover width={420}>
              <DestinationPanel
                value={value}
                onChange={onChange}
                query={destQuery}
                onPick={() => {
                  setDestQuery('');
                  setActive('date');
                }}
              />
            </Popover>
          )}
        </div>
        <Sep />
        {/* 체크인 + 체크아웃: 하나의 덩어리로 클릭 */}
        <div
          onClick={() => toggle('date')}
          onMouseEnter={() => setDateHover(true)}
          onMouseLeave={() => setDateHover(false)}
          style={{
            position: 'relative',
            flex: 2,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 60,
            background: active === 'date' || dateHover ? 'var(--surface-alt-2)' : 'transparent',
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
          {value.dates && (
            <ClearBtn onClear={() => onChange({ ...value, dates: '', range: null })} />
          )}
        </div>
        <Sep />
        <Segment
          label="인원"
          val={value.guestLabel}
          placeholder="게스트 추가"
          active={active === 'guest'}
          onClick={() => toggle('guest')}
          onClear={() =>
            onChange({ ...value, guests: { adult: 1, child: 0, infant: 0, pet: 0 }, guestLabel: '' })
          }
        />
        <button
          onClick={onSearch}
          style={{
            margin: '0 10px 0 4px',
            flex: 'none',
            border: 'none',
            cursor: 'pointer',
            height: 48,
            // fluid(확장 검색바)는 항상 '검색' 고정폭 → 조건 변경 시 레이아웃 안 밀림
            padding: fluid || value.dates ? '0 22px 0 16px' : 0,
            width: fluid || value.dates ? 'auto' : 48,
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
          {(fluid || value.dates) && '검색'}
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

function DestField({
  active,
  destination,
  query,
  onOpen,
  onQuery,
  onClear,
}: {
  active: boolean;
  destination: string;
  query: string;
  onOpen: () => void;
  onQuery: (q: string) => void;
  onClear: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => {
        if (!active) onOpen();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        padding: '0 26px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
        cursor: 'pointer',
        borderRadius: 60,
        background: active || hovered ? 'var(--surface-alt-2)' : 'transparent',
        transition: 'background 120ms ease',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-strong)' }}>여행지</span>
      {active ? (
        <input
          autoFocus
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="여행지 검색"
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 0,
            fontSize: 15,
            fontFamily: 'var(--font-sans)',
            color: 'var(--ink-1)',
            width: '100%',
          }}
        />
      ) : (
        <span style={{ fontSize: 15, color: destination ? 'var(--ink-1)' : 'var(--ink-3)', paddingRight: destination ? 24 : 0 }}>
          {destination || '여행지 검색'}
        </span>
      )}
      {!active && destination && <ClearBtn onClear={onClear} />}
    </div>
  );
}

function Segment({
  label,
  val,
  placeholder,
  active,
  onClick,
  onClear,
  noFlex,
}: {
  label: string;
  val: string;
  placeholder: string;
  active: boolean;
  onClick: () => void;
  onClear?: () => void;
  noFlex?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
        // 열린 탭(active) 또는 hover 시 강조
        background: active || hovered ? 'var(--surface-alt-2)' : 'transparent',
        transition: 'background 120ms ease',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-strong)' }}>{label}</span>
      <span style={{ fontSize: 15, color: val ? 'var(--ink-1)' : 'var(--ink-3)', paddingRight: val && onClear ? 24 : 0 }}>
        {val || placeholder}
      </span>
      {val && onClear && <ClearBtn onClear={onClear} />}
    </div>
  );
}

function Sep() {
  return (
    <span style={{ width: 1, height: 40, background: 'var(--line)', flexShrink: 0 }} />
  );
}

// 조건 제거 x 버튼 — 세그먼트 우측에 표시
function ClearBtn({ onClear }: { onClear: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClear();
      }}
      aria-label="조건 지우기"
      style={{
        position: 'absolute',
        right: 8,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: 'none',
        background: 'var(--surface-alt-2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--line-strong)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
    >
      <Icon name="x" size={13} color="var(--ink-1)" />
    </button>
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
