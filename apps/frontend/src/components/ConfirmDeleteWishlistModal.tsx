import { useEffect } from 'react';

interface ConfirmDeleteWishlistModalProps {
  open: boolean;
  /** 삭제 대상 위시리스트 이름 (안내 문구에 노출) */
  name: string;
  deleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 위시리스트 삭제 확인 모달. 목록/상세 양쪽에서 공용으로 쓴다.
 * 삭제는 되돌릴 수 없으므로 확인 단계를 한 번 거친다.
 */
export function ConfirmDeleteWishlistModal({
  open, name, deleting, error, onClose, onConfirm,
}: ConfirmDeleteWishlistModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="위시리스트 삭제"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: 420, maxWidth: '100%',
          padding: '28px 24px 20px', boxShadow: 'var(--shadow-pop)',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 10 }}>
          위시리스트를 삭제할까요?
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          '{name}' 위시리스트와 저장된 항목이 모두 삭제됩니다. 이 작업은 되돌릴 수 없어요.
        </div>
        {error && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--brand-coral)' }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              height: 46, padding: '0 18px', borderRadius: 8,
              border: '1px solid var(--line-strong)', background: '#fff',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
              color: 'var(--ink-1)', cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            disabled={deleting}
            onClick={onConfirm}
            style={{
              height: 46, padding: '0 18px', borderRadius: 8, border: 'none',
              background: 'var(--brand-coral)', color: '#fff',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
              cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
