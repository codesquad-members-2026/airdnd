import { useCancelReservationMutation, useReservationsQuery } from '../../features/reservations/api/reservationsQueries';
import { ReservationList } from '../../features/reservations/ui/ReservationList';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';

export function ReservationsPage() {
  const reservationsQuery = useReservationsQuery();
  const cancelMutation = useCancelReservationMutation();

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="eyebrow">Reservations</p>
        <h1>예약 목록</h1>
      </div>
      {reservationsQuery.isLoading ? <Loading message="예약 목록을 불러오는 중입니다." /> : null}
      {reservationsQuery.error ? <ErrorMessage error={reservationsQuery.error} /> : null}
      {cancelMutation.error ? <ErrorMessage error={cancelMutation.error} /> : null}
      {reservationsQuery.data ? (
        <ReservationList
          reservations={reservationsQuery.data}
          isCanceling={cancelMutation.isPending}
          onCancel={(reservationId) => cancelMutation.mutate(reservationId)}
        />
      ) : null}
    </section>
  );
}
