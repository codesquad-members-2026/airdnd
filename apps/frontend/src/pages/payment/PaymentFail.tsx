import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * 토스 결제창이 결제 실패/취소 시 리다이렉트하는 페이지.
 * URL: /payments/fail?code=...&message=...
 *
 * 실패해도 예약(PENDING)·결제(READY)는 그대로 둔다. 선점 해제는 TTL이 전담하고,
 * 사용자는 15분 내 다시 결제(prepare 재요청)할 수 있다. confirm은 절대 호출하지 않는다.
 */

/** 흔한 사용자 취소만 따로 안내. 나머지는 토스 message(한글 사유)를 그대로 쓴다. */
function friendlyMessage(code: string | null, message: string | null): string {
  if (code === 'PAY_PROCESS_CANCELED') return '결제를 취소했어요.';
  return message ?? '결제가 완료되지 않았어요. 다시 시도해 주세요.';
}

export function PaymentFail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = params.get('code');
  const message = params.get('message');

  return (
    <div style={wrapStyle}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>⚠️</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '16px 0 8px' }}>결제에 실패했어요</h1>
      <p style={{ color: 'var(--brand-coral)', fontSize: 16, marginBottom: 28 }}>
        {friendlyMessage(code, message)}
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button style={primaryBtn} onClick={() => navigate('/results')}>숙소 다시 보기</button>
        <button style={ghostBtn} onClick={() => navigate('/')}>홈으로</button>
      </div>

      {code && (
        <p style={{ marginTop: 28, fontSize: 12, color: 'var(--ink-4)' }}>오류 코드: {code}</p>
      )}
    </div>
  );
}

const wrapStyle = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '80px 24px',
  textAlign: 'center',
  fontFamily: 'var(--font-sans)',
} as const;

const primaryBtn = {
  height: 48,
  padding: '0 22px',
  border: 'none',
  borderRadius: 10,
  background: 'var(--cta-dark)',
  color: '#fff',
  fontFamily: 'var(--font-sans)',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
} as const;

const ghostBtn = {
  ...primaryBtn,
  background: 'var(--surface-alt-2)',
  color: 'var(--ink-1)',
} as const;
