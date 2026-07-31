import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Check, Clock, ShieldCheck } from 'lucide-react';
import { env } from '../../shared/config/env';
import { getStayNights } from '../../shared/lib/date';
import { formatCurrency, formatDate } from '../../shared/lib/format';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';
import { capturePaymentOrder, createPaymentOrder } from '../../features/payments/api/paymentsApi';
import {
  reservationQueryKeys,
  useReservationQuery,
} from '../../features/reservations/api/reservationsQueries';
import { roomQueryKeys } from '../../features/rooms/api/roomsQueries';
import { Reservation } from '../../features/reservations/model/reservationTypes';

export function CheckoutPage() {
  const { reservationId } = useParams();
  const id = Number(reservationId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // URL 파라미터 → 서버에서 예약을 다시 불러온다 (router state 대신). 새로고침·새 탭·재방문 OK.
  const { data: reservation, isLoading, isError, error } = useReservationQuery(id);
  const [payError, setPayError] = useState<unknown>(null);
  // 카운트다운이 0에 도달하면 서버 재요청 없이 로컬에서 곧장 만료 화면으로 전환한다.
  // (서버는 아직 PENDING 을 반환할 수 있고, 동일 데이터면 React Query 가 리렌더하지 않아
  //  invalidate 만으로는 새로고침 전까지 화면이 안 바뀐다 — ReservationDetailPage 와 동일한 방식.)
  const [holdExpired, setHoldExpired] = useState(false);
  // 다른 예약으로 이동하면(같은 컴포넌트, id 만 변경) 만료 플래그를 초기화한다.
  // effect 대신 React 권장 "렌더 중 prop 변경 감지" 패턴 — 추가 렌더 없이 즉시 반영.
  const [trackedId, setTrackedId] = useState(id);
  if (trackedId !== id) {
    setTrackedId(id);
    setHoldExpired(false);
  }
  // 진입 시점의 "현재 시각"을 한 번만 고정(lazy init) — 렌더 본문에서 Date.now() 를
  // 직접 부르면 비순수로 간주되므로, 최초 만료 판정은 이 값으로 한다.
  // 이후 진행 중 만료는 아래 Countdown 이 onExpire 로 처리한다.
  const [mountNow] = useState(() => Date.now());
  const handleHoldExpired = useCallback(() => setHoldExpired(true), []);

  if (!Number.isFinite(id)) return <Navigate to="/" replace />;
  if (isLoading) return <Loading message="예약 정보를 불러오는 중입니다." />;
  if (isError || !reservation) {
    return (
      <div className="checkout-page">
        <div className="checkout-page__inner">
          <ErrorMessage error={error ?? new Error('예약을 찾을 수 없습니다.')} />
          <Link to="/reservations" className="booking-submit as-link">
            예약 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const expiresAt = reservation.expiresAt ? new Date(reservation.expiresAt) : null;
  const isExpired = holdExpired || (expiresAt ? expiresAt.getTime() <= mountNow : false);

  // 상태로 분기 — 이 페이지는 이제 어떤 상태로든 진입 가능하다.
  if (reservation.status === 'CONFIRMED') return <AlreadyPaid reservation={reservation} />;
  if (reservation.status === 'CANCELLED' || isExpired) return <Expired />;

  // status === 'PENDING' && 만료 전 → 결제 UI
  const nights = getStayNights(reservation.checkIn, reservation.checkOut);
  const paypalConfigured = env.paypalClientId.length > 0;

  return (
    <div className="checkout-page">
      <div className="checkout-page__inner">
        <header className="checkout-header">
          <div className="page-heading">
            <p className="eyebrow">Checkout</p>
            <h1>결제하기</h1>
            <p className="reservation-intro">
              남은 시간 안에 결제를 완료하면 예약이 바로 확정돼요.
            </p>
          </div>
          {expiresAt ? <Countdown target={expiresAt} onExpire={handleHoldExpired} /> : null}
        </header>

        <div className="checkout-layout">
          {/* 좌측: 결제 수단 */}
          <section className="checkout-pay">
            <h2 className="checkout-section-title">결제 수단</h2>

            {!paypalConfigured ? (
              <div className="checkout-config-warning">
                <p>PayPal 클라이언트 ID 가 설정되지 않았습니다.</p>
                <p className="checkout-config-warning__hint">
                  <code>VITE_PAYPAL_CLIENT_ID</code> 를 <code>.env</code> 에 설정한 뒤 다시 시도하세요.
                </p>
              </div>
            ) : (
              <PayPalScriptProvider
                options={{
                  clientId: env.paypalClientId,
                  currency: env.paypalCurrency,
                  intent: 'capture',
                }}
              >
                <PayPalButtons
                  style={{ layout: 'vertical', label: 'pay' }}
                  // 주문 생성: reservationId 만 보낸다. 금액은 백엔드가 예약에서 재계산.
                  createOrder={async () => {
                    setPayError(null);
                    const { orderId } = await createPaymentOrder(id);
                    return orderId;
                  }}
                  // capture → 예약 PENDING→CONFIRMED. 성공 시 예약 상세로 이동.
                  onApprove={async (data) => {
                    try {
                      await capturePaymentOrder(data.orderID);
                      await queryClient.invalidateQueries({
                        queryKey: reservationQueryKeys.detail(id),
                      });
                      queryClient.invalidateQueries({ queryKey: reservationQueryKeys.listPrefix });
                      queryClient.invalidateQueries({
                        queryKey: roomQueryKeys.detail(reservation.roomId),
                      });
                      navigate(`/reservations/${id}`, { replace: true });
                    } catch (err) {
                      setPayError(err);
                    }
                  }}
                  onError={(err) =>
                    setPayError(err instanceof Error ? err : new Error(String(err)))
                  }
                />
              </PayPalScriptProvider>
            )}

            {payError ? (
              <div className="checkout-error">
                <ErrorMessage error={payError} />
              </div>
            ) : null}

            <p className="checkout-fineprint">
              결제는 PayPal 을 통해 {env.paypalCurrency} 로 처리됩니다. 표시 금액(원)은 참고용입니다.
            </p>
          </section>

          {/* 우측: 예약 요약 — 전부 reservation 에서 온다 (room 스냅샷·router state 불필요) */}
          <aside className="checkout-summary">
            <div className="checkout-summary__card">
              <span className="checkout-summary__badge">
                <Clock size={14} strokeWidth={2.4} />
                결제 대기중
              </span>

              <div className="checkout-summary__room">
                {reservation.roomUrl ? (
                  <img
                    className="checkout-summary__thumb"
                    src={reservation.roomUrl}
                    alt={reservation.roomName}
                  />
                ) : null}
                <div>
                  <p className="checkout-summary__room-name">{reservation.roomName}</p>
                  <p className="checkout-summary__room-region">{reservation.region}</p>
                </div>
              </div>

              <hr className="checkout-summary__divider" />

              <SummaryRow
                label="일정"
                value={`${formatDate(reservation.checkIn)} → ${formatDate(reservation.checkOut)} · ${nights}박`}
              />
              <SummaryRow label="인원" value={`게스트 ${reservation.guests}명`} />

              <hr className="checkout-summary__divider" />

              <div className="checkout-summary__line">
                <span>
                  {formatCurrency(reservation.pricePerNight)} × {nights}박
                </span>
                <span>{formatCurrency(reservation.totalPrice)}</span>
              </div>
              <div className="checkout-summary__total">
                <span>총 합계</span>
                <span>{formatCurrency(reservation.totalPrice)}</span>
              </div>
            </div>

            {/* 예약 안내 — 이 PENDING 홀드 흐름에서 실제로 참인 내용만 담는다 */}
            <div className="checkout-reassure">
              <h3 className="checkout-reassure__title">예약 안내</h3>
              <ul className="checkout-reassure__list">
                <li className="checkout-reassure__item">
                  <ShieldCheck className="checkout-reassure__icon" size={20} strokeWidth={1.8} />
                  <span>결제는 PayPal 보안 결제로 안전하게 처리돼요.</span>
                </li>
                <li className="checkout-reassure__item">
                  <Clock className="checkout-reassure__icon" size={20} strokeWidth={1.8} />
                  <span>대기 시간 안에 결제하지 않으면 예약이 자동으로 취소돼요.</span>
                </li>
                <li className="checkout-reassure__item">
                  <BadgeCheck className="checkout-reassure__icon" size={20} strokeWidth={1.8} />
                  <span>결제가 완료되면 예약이 즉시 확정되고 알림으로 안내해 드려요.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// 만료 카운트다운. 0 이 되면 onExpire 로 상위에 만료를 알려 즉시 만료 화면으로 전환한다.
function Countdown({ target, onExpire }: { target: Date; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const tick = () => {
      const left = target.getTime() - Date.now();
      setRemaining(left);
      if (left <= 0) onExpire();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target, onExpire]);

  if (remaining <= 0) return null;
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const urgent = remaining < 60000;
  return (
    <div className={`reservation-countdown${urgent ? ' reservation-countdown--urgent' : ''}`}>
      <span className="reservation-countdown__label">결제 마감까지</span>
      <span className="reservation-countdown__time">
        {m}:{String(s).padStart(2, '0')}
      </span>
    </div>
  );
}

function AlreadyPaid({ reservation }: { reservation: Reservation }) {
  return (
    <div className="checkout-page">
      <div className="checkout-page__inner">
        <div className="booking-success">
          <div className="booking-success__check">
            <Check size={34} strokeWidth={3} color="#fff" />
          </div>
          <h2 className="booking-success__title">이미 결제가 완료된 예약입니다.</h2>
          <Link to={`/reservations/${reservation.id}`} className="booking-submit as-link">
            예약 상세 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

function Expired() {
  return (
    <div className="checkout-page">
      <div className="checkout-page__inner">
        <div className="booking-success">
          <h2 className="booking-success__title">예약 대기 시간이 만료되었습니다.</h2>
          <p className="booking-success__desc">날짜를 다시 선택해 예약을 진행해 주세요.</p>
          <Link to="/" className="booking-submit as-link">
            숙소 둘러보기
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="booking-summary-row">
      <span className="booking-summary-row__label">{label}</span>
      <span className="booking-summary-row__value">{value}</span>
    </div>
  );
}
