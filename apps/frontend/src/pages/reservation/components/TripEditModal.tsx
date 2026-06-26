import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarModal } from '../../../components/panels/CalendarModal';
import { GuestPanel } from '../../../components/panels/GuestPanel';
import { Icon } from '../../../shared/Icon';
import type { SearchState } from '../../../types';

export type TripEditType = 'date' | 'guest';

interface TripEditModalProps {
  type: TripEditType;
  search: SearchState;
  onSave: (v: SearchState) => void;
  onClose: () => void;
}

const META: Record<TripEditType, { title: string; desc?: string; width: number }> = {
  date: { title: '날짜 변경', width: 840 },
  guest: {
    title: '인원수 변경',
    desc: '이 숙소의 최대 숙박 인원은 6명(유아 제외)입니다. 반려동물을 3마리 이상 동반하는 경우, 호스트에게 알려주세요.',
    width: 720,
  },
};

export function TripEditModal({ type, search, onSave, onClose }: TripEditModalProps) {
  // draft: 저장 누르기 전까지 부모 상태에 반영 안 됨
  const [draft, setDraft] = useState<SearchState>(search);
  const meta = META[type];

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 20,
          width: meta.width,
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-pop)',
          padding: 40,
          position: 'relative',
        }}
      >
        {/* 닫기 (취소) */}
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Icon name="x" size={20} />
        </button>

        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, marginBottom: meta.desc ? 14 : 24 }}>
          {meta.title}
        </h2>
        {meta.desc && (
          <p style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: 16 }}>{meta.desc}</p>
        )}

        {type === 'date' ? (
          <CalendarModal value={draft} onChange={setDraft} />
        ) : (
          <GuestPanel value={draft} onChange={setDraft} />
        )}

        {/* 푸터 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid var(--line)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 16,
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
              color: 'var(--ink-1)',
            }}
          >
            취소
          </button>
          <button
            onClick={() => onSave(draft)}
            style={{
              height: 48,
              padding: '0 30px',
              border: 'none',
              borderRadius: 10,
              background: 'var(--cta-dark)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
