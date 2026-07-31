import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 모달 카드의 최대 너비 (기본 440px) */
  maxWidth?: number;
  /** 우측 상단 닫기(X) 버튼 노출 여부 (기본 true) */
  showCloseButton?: boolean;
  /** 접근성 라벨 */
  ariaLabel?: string;
}

export function Modal({
  open,
  onClose,
  children,
  maxWidth = 440,
  showCloseButton = true,
  ariaLabel,
}: ModalProps) {
  // 열려 있는 동안 ESC 키로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="modal-card"
        style={{ maxWidth: `${maxWidth}px` }}
        onClick={(event) => event.stopPropagation()}
      >
        {showCloseButton && (
          <button type="button" onClick={onClose} aria-label="닫기" className="modal-close">
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
