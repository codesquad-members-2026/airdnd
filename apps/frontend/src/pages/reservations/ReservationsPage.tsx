import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  useCancelReservationMutation,
  useReservationCountsQuery,
  useReservationsQuery,
} from '../../features/reservations/api/reservationsQueries';
import { ReservationList } from '../../features/reservations/ui/ReservationList';
import { GuestReservationTab } from '../../features/reservations/model/reservationTypes';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { InfiniteScrollSentinel } from '../../shared/ui/InfiniteScrollSentinel';
import { Modal } from '../../shared/ui/Modal';

export function ReservationsPage() {
  // 선택된 탭이 어떤 커서 무한 쿼리를 돌릴지 결정한다.
  const [activeTab, setActiveTab] = useState<GuestReservationTab>('upcoming');

  const reservationsQuery = useReservationsQuery(activeTab);
  const countsQuery = useReservationCountsQuery();
  const cancelMutation = useCancelReservationMutation();
  // 어떤 예약을 취소 중인지 추적해 해당 카드에만 로딩을 표시
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  // 취소 완료 배너 노출 여부 (닫기 버튼으로 직접 닫을 수 있도록 상태로 관리)
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);

  const reservations = reservationsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const handleCancel = (reservationId: number) => {
    setCancelingId(reservationId);
    cancelMutation.mutate(reservationId, {
      onSuccess: () => setShowCancelSuccess(true),
      onSettled: () => setCancelingId(null),
    });
  };

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="eyebrow">Reservations</p>
        <h1>예약 목록</h1>
        <p className="reservation-intro">다가오는 여행과 지난 여행을 한곳에서 관리하세요.</p>
      </div>
      {reservationsQuery.error ? <ErrorMessage error={reservationsQuery.error} /> : null}
      {cancelMutation.error ? <ErrorMessage error={cancelMutation.error} /> : null}

      <ReservationList
        reservations={reservations}
        counts={countsQuery.data}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLoading={reservationsQuery.isLoading}
        cancelingId={cancelingId}
        onCancel={handleCancel}
      />

      <InfiniteScrollSentinel
        onReachEnd={() => reservationsQuery.fetchNextPage()}
        hasNext={reservationsQuery.hasNextPage}
        isFetching={reservationsQuery.isFetchingNextPage}
      />

      {/* 취소 완료 안내 — 확인을 누르면 닫히며 예약 목록이 보인다 */}
      <Modal
        open={showCancelSuccess && cancelingId === null}
        onClose={() => setShowCancelSuccess(false)}
        ariaLabel="예약 취소 완료"
        maxWidth={420}
      >
        <div className="cancel-success">
          <div className="cancel-success__icon" aria-hidden="true">
            <Check size={32} strokeWidth={3} />
          </div>
          <h2 className="cancel-success__title">예약이 취소되었습니다</h2>
          <p className="cancel-success__desc">환불 금액은 숙소의 취소 정책에 따라 결정됩니다.</p>
          <button
            type="button"
            className="primary-button full-width"
            onClick={() => {
              setShowCancelSuccess(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            확인
          </button>
        </div>
      </Modal>
    </section>
  );
}
