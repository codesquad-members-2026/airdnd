import { useState, useEffect } from 'react';
import { Icon } from '../shared/Icon';

const MAX_NAME = 50;

interface RenameWishlistModalProps {
  open: boolean;
  initialName: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  /** 저장: 새 이름(trim 적용)을 넘긴다 */
  onSave: (name: string) => void;
}

/**
 * 위시리스트 "이름 변경" 모달.
 * 빈 이름은 저장 불가(백엔드 name 은 @NotBlank + @Size(max=50)).
 * 저장/닫기/제출 상태는 부모(WishlistDetailPage)가 소유한다.
 */
export function RenameWishlistModal({
  open,
  initialName,
  submitting,
  error,
  onClose,
  onSave,
}: RenameWishlistModalProps) {
  const [name, setName] = useState(initialName);
  const [focused, setFocused] = useState(false);

  // 열릴 때마다 현재 이름으로 초기화
  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  // ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSave = name.trim().length > 0 && !submitting;
  const save = () => canSave && onSave(name.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이름 변경"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: 540,
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-pop)',
        }}
      >
        <header style={headerStyle}>
          <span style={titleStyle}>이름 변경</span>
          <button aria-label="닫기" onClick={onClose} style={iconBtnStyle}>
            <Icon name="x" size={20} />
          </button>
        </header>

        <div style={{ padding: '24px 20px' }}>
          <input
            autoFocus
            value={name}
            maxLength={MAX_NAME}
            placeholder="위시리스트 이름"
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSave) save();
            }}
            style={{
              width: '100%',
              height: 56,
              padding: '0 16px',
              boxSizing: 'border-box',
              borderRadius: 12,
              border: `1px solid ${focused ? 'var(--ink-1)' : 'var(--line-strong)'}`,
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              color: 'var(--ink-1)',
            }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-3)' }}>
            {name.length}/{MAX_NAME}자
          </div>
          {error && <div style={{ ...errorTextStyle, marginTop: 12 }}>{error}</div>}
        </div>

        <footer style={footerStyle}>
          <button onClick={onClose} style={textBtnStyle}>
            취소
          </button>
          <button disabled={!canSave} onClick={save} style={primaryBtnStyle(canSave)}>
            {submitting ? '저장 중...' : '저장'}
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ── 스타일 (EditNoteModal 과 동일 토큰) ───────────────────────── */

const headerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '18px 20px',
  borderBottom: '1px solid var(--line-soft)',
  flex: 'none',
} as const;

const titleStyle = { fontSize: 16, fontWeight: 700, color: 'var(--ink-1)' } as const;

const iconBtnStyle = {
  position: 'absolute',
  right: 14,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 6,
  display: 'flex',
  color: 'var(--ink-1)',
} as const;

const footerStyle = {
  padding: '14px 20px',
  borderTop: '1px solid var(--line-soft)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flex: 'none',
} as const;

const errorTextStyle = {
  fontSize: 13,
  color: 'var(--brand-coral)',
} as const;

const textBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--ink-1)',
  textDecoration: 'underline',
  padding: 6,
} as const;

function primaryBtnStyle(enabled: boolean) {
  return {
    height: 46,
    padding: '0 22px',
    border: 'none',
    borderRadius: 8,
    background: enabled ? 'var(--cta-dark)' : 'var(--surface-alt-2)',
    color: enabled ? '#fff' : 'var(--ink-4)',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    fontWeight: 700,
    cursor: enabled ? 'pointer' : 'default',
  } as const;
}
