import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  reservationQueryKeys,
  useCancelReservationMutation,
  useReservationQuery,
} from '../../features/reservations/api/reservationsQueries';
import { getStayNights } from '../../shared/lib/date';
import { formatCurrency, formatStayRange } from '../../shared/lib/format';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';
import { Modal } from '../../shared/ui/Modal';

export function ReservationDetailPage() {
  const { reservationId } = useParams();
  const id = Number(reservationId);
  const queryClient = useQueryClient();

  const reservationQuery = useReservationQuery(id);
  const cancelMutation = useCancelReservationMutation();
  const [confirmCancel, setConfirmCancel] = useState(false);
  // 카운트다운이 0에 도달하면 서버를 다시 부르지 않고 로컬에서만 만료 화면으로 전환한다.
  const [holdExpired, setHoldExpired] = useState(false);
  // 다른 예약으로 이동하면(같은 컴포넌트, id 만 변경) 만료 플래그를 초기화한다.
  // effect 대신 React 권장 "렌더 중 prop 변경 감지" 패턴.
  const [trackedId, setTrackedId] = useState(id);
  if (trackedId !== id) {
    setTrackedId(id);
    setHoldExpired(false);
  }
  // 진입 시점의 현재 시각을 한 번만 고정(lazy init) — 렌더 본문의 Date.now() 비순수 호출 회피.
  // 진행 중 만료는 아래 Countdown 이 onExpire 로 처리한다.
  const [mountNow] = useState(() => Date.now());
  const handleHoldExpired = useCallback(() => setHoldExpired(true), []);

  if (reservationQuery.isLoading) {
    return <Loading message="예약 정보를 불러오는 중입니다." />;
  }
  if (reservationQuery.error) {
    return <ErrorMessage error={reservationQuery.error} />;
  }
  const reservation = reservationQuery.data;
  if (!reservation) {
    return null;
  }

  const nights = getStayNights(reservation.checkIn, reservation.checkOut);
  const expiresAt = reservation.expiresAt ? new Date(reservation.expiresAt) : null;
  const isExpired = holdExpired || (expiresAt ? expiresAt.getTime() <= mountNow : false);
  const isCancelled = reservation.status === 'CANCELLED';
  const isConfirmed = reservation.status === 'CONFIRMED';
  const isPendingActive = reservation.status === 'PENDING' && !isExpired;
  const isPendingExpired = reservation.status === 'PENDING' && isExpired;

  const refetchDetail = () =>
    queryClient.invalidateQueries({ queryKey: reservationQueryKeys.detail(id) });

  const handleCancel = () => {
    setConfirmCancel(false);
    cancelMutation.mutate(reservation.id, { onSuccess: refetchDetail });
  };

  // 취소 가능: 확정됐거나 결제 대기 중인 예약 (이미 취소/만료된 건은 불가)
  const cancellable = isConfirmed || isPendingActive;

  // 상태별 화면 구성 — 결제 완료(확정)가 기본이며, 결제가 끝나면 곧장 이 화면으로 들어온다.
  const view = isConfirmed
    ? {
        tone: 'success' as const,
        pill: '예약 확정',
        headline: (
          <>
            예약이
            <br />
            확정됐어요
          </>
        ),
        lead: '결제가 완료되어 예약이 확정됐어요. 확정 내역과 체크인 안내를 이메일로 보내드렸어요.',
        primary: { label: '예약 목록으로', to: '/reservations' },
        secondary: { label: '숙소 상세 보기', to: `/rooms/${reservation.roomId}` },
      }
    : isPendingActive
      ? {
          tone: 'warning' as const,
          pill: '결제 대기',
          headline: (
            <>
              결제를
              <br />
              완료해 주세요
            </>
          ),
          lead: '제한 시간 안에 결제를 완료해야 예약이 확정돼요.',
          primary: { label: '결제 계속하기', to: `/checkout/${reservation.id}` },
        }
      : isPendingExpired
        ? {
            tone: 'neutral' as const,
            pill: '시간 만료',
            headline: (
              <>
                결제 시간이
                <br />
                만료됐어요
              </>
            ),
            lead: '결제 제한 시간이 지나 선점이 해제됐어요. 다시 예약해 주세요.',
            primary: { label: '다시 예약하기', to: `/rooms/${reservation.roomId}` },
          }
        : {
            tone: 'neutral' as const,
            pill: '예약 취소',
            headline: (
              <>
                취소된
                <br />
                예약이에요
              </>
            ),
            lead: '환불 금액은 숙소의 취소 정책에 따라 결정돼요.',
            primary: { label: '숙소 둘러보기', to: '/' },
          };

  return (
    <section className={`confirm-stage${isCancelled ? ' confirm-stage--muted' : ''}`}>
      <div className="confirm-split">
        <article className="stay-card">
          <div className="stay-card__media">
            <img src={reservation.roomUrl} alt={`${reservation.roomName} 대표 이미지`} />
            <span className={`stay-pill stay-pill--${view.tone}`}>
              <span className="dot" />
              {view.pill}
            </span>
          </div>
          <div className="stay-card__body">
            <h2 className="stay-card__title">{reservation.roomName}</h2>
            <p className="stay-card__dates">
              {formatStayRange(reservation.checkIn, reservation.checkOut)}
            </p>
            <div className="stay-card__foot">
              <p>
                게스트 {reservation.guests}명 · {nights}박
              </p>
              <p className="stay-card__total">
                <strong>{formatCurrency(reservation.totalPrice)}</strong> 총액
              </p>
            </div>
          </div>
        </article>

        <section className="confirm-message">
          <h1>{view.headline}</h1>

          {isPendingActive && expiresAt ? (
            <Countdown targetMs={expiresAt.getTime()} onExpire={handleHoldExpired} />
          ) : null}

          <p className="confirm-message__lead">{view.lead}</p>

          <div className="confirm-actions">
            <Link className="confirm-btn-primary" to={view.primary.to}>
              {view.primary.label}
            </Link>
            {cancellable ? (
              <button
                type="button"
                className="confirm-btn-ghost"
                disabled={cancelMutation.isPending}
                onClick={() => setConfirmCancel(true)}
              >
                {cancelMutation.isPending ? (
                  <>
                    <span className="button-spinner" aria-hidden="true" /> 취소 중…
                  </>
                ) : (
                  <>
                    <X size={17} /> 예약 취소
                  </>
                )}
              </button>
            ) : null}
          </div>

          {'secondary' in view && view.secondary ? (
            <Link className="confirm-btn-text" to={view.secondary.to}>
              {view.secondary.label}
            </Link>
          ) : view.primary.to !== '/reservations' ? (
            <Link className="confirm-btn-text" to="/reservations">
              예약 목록으로
            </Link>
          ) : null}

          {cancelMutation.error ? (
            <div className="confirm-message__error">
              <ErrorMessage error={cancelMutation.error} />
            </div>
          ) : null}
        </section>
      </div>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        ariaLabel="예약 취소 확인"
        maxWidth={420}
      >
        <div className="cancel-confirm">
          <h2 className="cancel-confirm__title">예약을 취소할까요?</h2>
          <p className="cancel-confirm__desc">
            <strong>{reservation.roomName}</strong>
            <br />
            {formatStayRange(reservation.checkIn, reservation.checkOut)}
          </p>
          <p className="cancel-confirm__note">
            취소 후에는 되돌릴 수 없으며, 환불 금액은 숙소의 취소 정책에 따라 결정됩니다.
          </p>
          <div className="cancel-confirm__actions">
            <button type="button" className="secondary-button" onClick={() => setConfirmCancel(false)}>
              돌아가기
            </button>
            <button type="button" className="danger-button" onClick={handleCancel}>
              예약 취소
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

// 결제 마감 카운트다운. 0 이 되면 onExpire 를 한 번만 호출해 (서버 호출 없이) 만료 화면으로 전환한다.
// targetMs(숫자)와 onExpire(useCallback)는 렌더마다 안정적이라 effect 가 재실행되지 않는다.
function Countdown({ targetMs, onExpire }: { targetMs: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => targetMs - Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const left = targetMs - Date.now();
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetMs, onExpire]);

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
