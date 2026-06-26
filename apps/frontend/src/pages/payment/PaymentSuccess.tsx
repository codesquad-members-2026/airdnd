import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPayment, type PaymentConfirmResult } from '../../shared/api/payment';
import { PaymentStatusBadge } from '../reservation/components/PaymentStatusBadge';

/**
 * 토스 결제창이 결제 요청 성공 후 리다이렉트하는 페이지.
 * URL: /payments/success?paymentType=...&amount=...&orderId=...&paymentKey=...
 *
 * 마운트 시 자동으로 결제 승인(confirm)을 호출하고 결과를 표시한다.
 */
type Status = 'loading' | 'success' | 'fail';

export function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [result, setResult] = useState<PaymentConfirmResult | null>(null);
  const [error, setError] = useState('');

  // StrictMode(개발 모드)에서 useEffect가 2번 실행돼도 confirm은 정확히 1번만.
  // (2번째 호출은 "이미 완료된 결제"로 에러가 나므로 반드시 가드)
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const orderId = params.get('orderId');
    const paymentKey = params.get('paymentKey');
    const amountRaw = params.get('amount');
    const amount = Number(amountRaw); // URL 문자열 → 숫자

    if (!orderId || !paymentKey || !amountRaw || Number.isNaN(amount)) {
      setError('결제 정보가 올바르지 않아요.');
      setStatus('fail');
      return;
    }

    confirmPayment({ orderId, paymentKey, amount })
      .then((data) => {
        if (data.status !== 'DONE') {
          setError(`결제가 완료되지 않았어요 (${data.status}).`);
          setStatus('fail');
          return;
        }
        setResult(data);
        setStatus('success');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : '결제 승인에 실패했어요.');
        setStatus('fail');
      });
  }, [params]);

  if (status === 'loading') {
    return (
      <PageShell>
        <PaymentStatusBadge status="loading" />
        <h1 style={captionStyle}>결제 승인 중…</h1>
        <p style={{ color: 'var(--ink-3)', marginTop: 8 }}>잠시만 기다려 주세요.</p>
      </PageShell>
    );
  }

  if (status === 'fail') {
    return (
      <PageShell>
        <PaymentStatusBadge status="fail" />
        <h1 style={captionStyle}>결제 승인에 실패했어요</h1>
        <p style={{ color: 'var(--brand-coral)', marginTop: 12, marginBottom: 24 }}>{error}</p>
        <button style={primaryBtn} onClick={() => navigate('/')}>홈으로</button>
      </PageShell>
    );
  }

  // success
  const r = result!;
  return (
    <PageShell>
      <PaymentStatusBadge status="success" />
      <h1 style={captionStyle}>결제가 완료됐어요</h1>
      <p style={{ color: 'var(--ink-3)', marginTop: 8, marginBottom: 24 }}>예약이 확정되었습니다.</p>

      <dl style={{ textAlign: 'left', margin: '0 0 28px' }}>
        <Row label="결제 금액" value={`${r.amount.toLocaleString()}원`} />
        <Row label="결제 수단" value={r.method} />
        <Row label="승인 시각" value={new Date(r.approvedAt).toLocaleString('ko-KR')} />
        <Row label="주문번호" value={r.orderId} />
        <Row label="예약번호" value={String(r.reservationId)} />
      </dl>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button style={primaryBtn} onClick={() => navigate(`/trips/reservation/${r.reservationId}`)}>
          예약 보기
        </button>
        <button style={ghostBtn} onClick={() => navigate('/')}>홈으로</button>
      </div>
    </PageShell>
  );
}

// 결제 시작 로딩 모달과 동일한 오버레이 모달(dim 배경 + 중앙 카드)
function PageShell({ children }: { children: React.ReactNode }) {
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
          width: 440,
          maxWidth: '100%',
          padding: '56px 40px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-pop)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

const captionStyle = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: 22,
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <dt style={{ width: 96, color: 'var(--ink-3)', flex: 'none' }}>{label}</dt>
      <dd style={{ margin: 0, wordBreak: 'break-all', fontWeight: 600 }}>{value}</dd>
    </div>
  );
}

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
