import { Icon } from '../shared/Icon';
import { formatResultCount } from '../shared/formatCount';
import { PricePanel } from './panels/PricePanel';
import type { SearchState } from '../types';

interface FilterModalProps {
  open: boolean;
  value: SearchState;
  onChange: (v: SearchState) => void;
  onClose: () => void;
  // "숙소 N개 보기" — 필터 적용
  onApply: () => void;
  // "전체 해제" — 필터 초기화
  onReset: () => void;
  resultCount: number;
}

// 검색바 옆 필터 버튼으로 여는 모달. 우선 가격만 구현(기존 PricePanel 재활용)
export function FilterModal({ open, value, onChange, onClose, onApply, onReset, resultCount }: FilterModalProps) {
  if (!open) return null;

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 780,
          maxWidth: '92vw',
          maxHeight: '88vh',
          background: '#fff',
          borderRadius: 16,
          boxShadow: 'var(--shadow-pop)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            position: 'relative',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>필터</span>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              position: 'absolute',
              left: 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* 본문 */}
        <div style={{ padding: '28px 32px', overflowY: 'auto' }}>
          <PricePanel value={value} onChange={onChange} />
        </div>

        {/* 푸터 */}
        <div
          style={{
            height: 72,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--line)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onReset}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              color: 'var(--ink-1)',
            }}
          >
            전체 해제
          </button>
          <button
            onClick={onApply}
            style={{
              border: 'none',
              background: 'var(--cta-dark)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              padding: '14px 24px',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            숙소 {formatResultCount(resultCount)}개 보기
          </button>
        </div>
      </div>
    </div>
  );
}
