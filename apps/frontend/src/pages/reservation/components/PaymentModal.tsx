import { createPortal } from 'react-dom';
import { Icon } from '../../../shared/Icon';

export type PayStatus = 'loading' | 'success' | 'fail';

const CAPTION: Record<PayStatus, string> = {
  loading: '결제를 처리하고 있어요',
  success: '결제가 완료되었어요',
  fail: '결제에 실패했어요',
};

interface PaymentModalProps {
  status: PayStatus;
  errorMessage?: string;
  onClose?: () => void;
}

export function PaymentModal({ status, errorMessage, onClose }: PaymentModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 250,
        padding: 24,
      }}
    >
      <div
        className="popover-enter"
        style={{
          background: '#fff',
          borderRadius: 20,
          width: 420,
          maxWidth: '100%',
          padding: '56px 40px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-pop)',
        }}
      >
        <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          {status === 'loading' && <div className="pay-spinner" style={{ width: 64, height: 64 }} />}
          {status === 'success' && (
            <div className="pay-pop" style={badge('var(--brand-coral)')}>
              <Icon name="check" size={38} color="#fff" />
            </div>
          )}
          {status === 'fail' && (
            <div className="pay-pop" style={badge('var(--ink-2)')}>
              <Icon name="x" size={38} color="#fff" />
            </div>
          )}
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
          {CAPTION[status]}
        </div>

        {status === 'fail' && (
          <>
            {errorMessage && (
              <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 12, lineHeight: 1.6 }}>
                {errorMessage}
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                marginTop: 28,
                width: '100%',
                height: 48,
                border: 'none',
                borderRadius: 10,
                background: 'var(--cta-dark)',
                color: '#fff',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function badge(bg: string): React.CSSProperties {
  return {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
