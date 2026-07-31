import { useState } from 'react';
import { Check, MapPin, SquarePen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../../shared/lib/format';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import { Loading } from '../../../shared/ui/Loading';
import { Modal } from '../../../shared/ui/Modal';
import { useCreateReviewMutation } from '../../reviews/api/reviewsQueries';
import { ReviewForm } from '../../reviews/ui/ReviewForm';
import type { CreateReviewFormValues } from '../../reviews/model/reviewTypes';
import {
  GuestReservationCounts,
  GuestReservationTab,
  Reservation,
  ReservationStatus,
} from '../model/reservationTypes';

type ReservationListProps = {
  // 서버가 activeTab 으로 이미 필터링·정렬한 한 묶음(여러 페이지를 평탄화한 결과).
  reservations: Reservation[];
  // 탭 배지에 표시할 전체 카운트(로딩 중이면 undefined).
  counts: GuestReservationCounts | undefined;
  activeTab: GuestReservationTab;
  onTabChange: (tab: GuestReservationTab) => void;
  // 현재 탭 첫 페이지 로딩 여부.
  isLoading: boolean;
  onCancel: (reservationId: number) => void;
  /** 현재 취소 요청이 진행 중인 예약 id (해당 카드에만 로딩 표시) */
  cancelingId?: number | null;
};

// 상태 배지: 제목 행 오른쪽 끝. 호스트 숙소 카드와 동일한 솔리드 펠릿 색을 쓴다.
const statusConfig: Record<ReservationStatus, { badgeClass: string; label: string }> = {
  CONFIRMED: { badgeClass: 'is-active', label: '확정' },
  PENDING: { badgeClass: 'is-pending', label: '대기' },
  CANCELLED: { badgeClass: 'is-inactive', label: '취소' },
};

const tabMeta: { key: GuestReservationTab; label: string }[] = [
  { key: 'upcoming', label: '다가오는' },
  { key: 'past', label: '지난' },
  { key: 'cancelled', label: '취소' },
];

// 탭 키 → 카운트 요약의 해당 숫자.
function countFor(counts: GuestReservationCounts | undefined, key: GuestReservationTab): number | undefined {
  if (!counts) return undefined;
  return counts[key];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function nightsBetween(checkIn: string, checkOut: string) {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(diff / MS_PER_DAY));
}

// 깨졌거나 비어 있는 대표 이미지를 대체할 중립 플레이스홀더 (data URI라 onError 무한 루프 없음)
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150">' +
      '<rect width="100%" height="100%" fill="#f0f0f0"/>' +
      '<text x="50%" y="50%" fill="#bbbbbb" font-family="sans-serif" font-size="13" ' +
      'text-anchor="middle" dominant-baseline="middle">이미지 없음</text></svg>',
  );

export function ReservationList({
  reservations,
  counts,
  activeTab,
  onTabChange,
  isLoading,
  onCancel,
  cancelingId = null,
}: ReservationListProps) {
  // 취소 확인 모달 대상 (null이면 닫힘)
  const [confirmTarget, setConfirmTarget] = useState<Reservation | null>(null);
  // 후기 작성 모달 대상 (null이면 닫힘)
  const [reviewTarget, setReviewTarget] = useState<Reservation | null>(null);
  // 등록 성공 후 완료 화면을 띄울지 (모달을 닫지 않고 안내+이동 버튼을 보여준다)
  const [reviewDone, setReviewDone] = useState(false);

  const navigate = useNavigate();
  const createReviewMutation = useCreateReviewMutation();

  // 모달을 닫을 때 완료 상태와 직전 작성 에러도 함께 지운다 (다시 열었을 때 잔상 방지)
  const closeReviewModal = () => {
    setReviewTarget(null);
    setReviewDone(false);
    createReviewMutation.reset();
  };

  const handleReviewSubmit = (reservation: Reservation, values: CreateReviewFormValues) => {
    createReviewMutation.mutate(
      { reservationId: reservation.id, roomId: reservation.roomId, values },
      { onSuccess: () => setReviewDone(true) },
    );
  };

  // 한 건도 없으면(전체 카운트 0) 탭 없이 첫 예약 유도 화면을 보여준다.
  const totalCount = counts ? counts.upcoming + counts.past + counts.cancelled : undefined;
  if (totalCount === 0) {
    return (
      <EmptyState
        title="예약 내역이 없습니다."
        description="마음에 드는 숙소를 찾아 첫 예약을 만들어보세요."
        action={
          <Link to="/" className="primary-button inline-action">
            숙소 둘러보기
          </Link>
        }
      />
    );
  }

  const renderAction = (reservation: Reservation, tab: GuestReservationTab) => {
    // 지난 예약: 후기 작성(미작성 시) 또는 작성 완료 표시
    // 백엔드가 CONFIRMED 예약에만 리뷰를 허용하므로, 그 외(예: 결제 대기)에는 액션을 숨긴다
    if (tab === 'past') {
      if (reservation.status !== 'CONFIRMED') {
        return null;
      }
      return reservation.hasReview ? (
        <span className="reservation-review-done">
          <Check size={15} strokeWidth={2.5} aria-hidden="true" />
          리뷰 작성 완료
        </span>
      ) : (
        <button
          type="button"
          className="secondary-button"
          aria-label={`${reservation.roomName} 후기 작성`}
          onClick={() => setReviewTarget(reservation)}
        >
          <SquarePen size={16} strokeWidth={1.9} aria-hidden="true" />
          리뷰 작성
        </button>
      );
    }
    // 다가오는 예약: 취소 가능
    if (tab === 'upcoming') {
      const isCanceling = cancelingId === reservation.id;
      return (
        <button
          type="button"
          className="secondary-button"
          disabled={isCanceling}
          aria-label={`${reservation.roomName} 예약 취소`}
          onClick={() => setConfirmTarget(reservation)}
        >
          {isCanceling ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              취소 중…
            </>
          ) : (
            '예약 취소'
          )}
        </button>
      );
    }
    // 취소 탭: 액션 없음
    return null;
  };

  const renderCard = (reservation: Reservation, tab: GuestReservationTab) => {
    const nights = nightsBetween(reservation.checkIn, reservation.checkOut);
    const status = statusConfig[reservation.status];
    const isCancelled = reservation.status === 'CANCELLED';
    const action = renderAction(reservation, tab);

    return (
      <article className={`res-card${isCancelled ? ' is-cancelled' : ''}`} key={reservation.id}>
        <div className="res-card__media">
          <img
            src={reservation.roomUrl || FALLBACK_IMAGE}
            alt={`${reservation.roomName} 대표 이미지`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </div>
        <div className="res-card__body">
          <div className="res-card__top">
            <Link to={`/reservations/${reservation.id}`}>
              <h2 className="res-card__title">{reservation.roomName}</h2>
            </Link>
            <span className={`res-card__badge ${status.badgeClass}`}>{status.label}</span>
          </div>
          {reservation.region ? (
            <p className="res-card__loc">
              <MapPin size={15} strokeWidth={1.8} aria-hidden />
              {reservation.region}
            </p>
          ) : null}
          <div className="res-card__meta">
            <span>
              {formatDate(reservation.checkIn)} – {formatDate(reservation.checkOut)}
            </span>
            <span>
              {nights}박 · 게스트 {reservation.guests}명
            </span>
          </div>
          <p className="res-card__price">
            {formatCurrency(reservation.totalPrice)}
            <span>{formatCurrency(reservation.pricePerNight)} / 박</span>
          </p>
        </div>
        {action ? <div className="res-card__actions">{action}</div> : null}
      </article>
    );
  };

  // 활성 탭이 비었을 때 보여줄 안내 — 다가오는 탭만 둘러보기 CTA를 강조한다
  const renderEmptyPanel = () => {
    if (activeTab === 'upcoming') {
      return (
        <EmptyState
          title="예정된 예약이 없어요."
          description="새로운 숙소를 둘러보고 다음 여행을 계획해보세요."
          action={
            <Link to="/" className="primary-button inline-action">
              숙소 보러가기
            </Link>
          }
        />
      );
    }
    return (
      <EmptyState
        title={activeTab === 'past' ? '지난 여행이 없어요.' : '취소된 예약이 없어요.'}
        description={
          activeTab === 'past'
            ? '여행을 다녀오면 이곳에서 후기를 남길 수 있어요.'
            : '취소한 예약이 생기면 이곳에 모아둘게요.'
        }
      />
    );
  };

  return (
    <div className="reservation-board">
      <div className="segmented" role="tablist" aria-label="예약 상태 필터">
        {tabMeta.map(({ key, label }) => {
          const active = activeTab === key;
          const count = countFor(counts, key);
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`seg-tab${active ? ' active' : ''}`}
              onClick={() => onTabChange(key)}
            >
              {label}
              {count !== undefined ? <span className="seg-tab__count">{count}</span> : null}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <Loading message="예약 목록을 불러오는 중입니다." />
      ) : reservations.length > 0 ? (
        <div className="res-grid">{reservations.map((reservation) => renderCard(reservation, activeTab))}</div>
      ) : (
        renderEmptyPanel()
      )}

      <Modal
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        ariaLabel="예약 취소 확인"
        maxWidth={420}
      >
        {confirmTarget ? (
          <div className="cancel-confirm">
            <h2 className="cancel-confirm__title">예약을 취소할까요?</h2>
            <p className="cancel-confirm__desc">
              <strong>{confirmTarget.roomName}</strong>
              <br />
              {formatDate(confirmTarget.checkIn)} - {formatDate(confirmTarget.checkOut)}
            </p>
            <p className="cancel-confirm__note">
              취소 후에는 되돌릴 수 없으며, 환불 금액은 숙소의 취소 정책에 따라 결정됩니다.
            </p>
            <div className="cancel-confirm__actions">
              <button type="button" className="secondary-button" onClick={() => setConfirmTarget(null)}>
                돌아가기
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  onCancel(confirmTarget.id);
                  setConfirmTarget(null);
                }}
              >
                예약 취소
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={reviewTarget !== null}
        onClose={closeReviewModal}
        ariaLabel="후기 작성"
        maxWidth={560}
      >
        {reviewTarget ? (
          reviewDone ? (
            <div className="review-done">
              <div className="review-done__icon" aria-hidden="true">
                <Check size={32} strokeWidth={3} />
              </div>
              <h2 className="review-done__title">후기가 등록되었습니다</h2>
              <p className="review-done__desc">
                <strong>{reviewTarget.roomName}</strong>에 남겨 주신 소중한 후기 감사합니다.
              </p>
              <div className="review-done__actions">
                <button type="button" className="secondary-button" onClick={closeReviewModal}>
                  예약 목록으로 돌아가기
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigate(`/rooms/${reviewTarget.roomId}`)}
                >
                  리뷰 보러가기
                </button>
              </div>
            </div>
          ) : (
            <div className="review-modal">
              <div className="review-modal__head">
                <h2 className="review-modal__title">후기 작성</h2>
                <p className="review-modal__room">
                  <strong>{reviewTarget.roomName}</strong>
                  <br />
                  {formatDate(reviewTarget.checkIn)} - {formatDate(reviewTarget.checkOut)}
                </p>
              </div>
              {createReviewMutation.error ? (
                <ErrorMessage error={createReviewMutation.error} />
              ) : null}
              <ReviewForm
                isSubmitting={createReviewMutation.isPending}
                onSubmit={(values) => handleReviewSubmit(reviewTarget, values)}
              />
            </div>
          )
        ) : null}
      </Modal>
    </div>
  );
}
