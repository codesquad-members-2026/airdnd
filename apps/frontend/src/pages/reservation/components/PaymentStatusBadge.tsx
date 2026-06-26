import { Icon } from '../../../shared/Icon';

// 결제 시작 로딩 모달과 동일한 배지 비주얼(스피너 → 아이콘 pop).
// loading: 코랄 스피너 / success: 코랄 체크 / fail: 회색 X / pending: 코랄 시계
export type PayBadgeStatus = 'loading' | 'success' | 'fail' | 'pending';

interface PaymentStatusBadgeProps {
  status: PayBadgeStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
      {status === 'loading' && <div className="pay-spinner" style={{ width: 64, height: 64 }} />}
      {status === 'success' && (
        <div className="pay-pop" style={badge('var(--brand-coral)')}>
          <Icon name="check" size={38} color="#fff" />
        </div>
      )}
      {status === 'pending' && (
        <div className="pay-pop" style={badge('var(--brand-coral)')}>
          <Icon name="clock" size={36} color="#fff" />
        </div>
      )}
      {status === 'fail' && (
        <div className="pay-pop" style={badge('var(--ink-2)')}>
          <Icon name="x" size={38} color="#fff" />
        </div>
      )}
    </div>
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
