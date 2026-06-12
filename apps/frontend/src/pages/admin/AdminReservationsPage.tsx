import { useAdminReservationsQuery } from '../../features/admin/api/adminQueries';
import { formatCurrency, formatDate } from '../../shared/lib/format';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';
import { StatusBadge } from '../../shared/ui/StatusBadge';

export function AdminReservationsPage() {
  const reservationsQuery = useAdminReservationsQuery();

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>예약 현황 대시보드</h1>
        <p className="muted">전체 예약 상태와 매출 흐름을 확인합니다.</p>
      </div>
      {reservationsQuery.isLoading ? <Loading message="예약 현황을 불러오는 중입니다." /> : null}
      {reservationsQuery.error ? <ErrorMessage error={reservationsQuery.error} /> : null}
      {reservationsQuery.data ? (
        <>
          <div className="metric-grid">
            <article className="metric-card">
              <span>전체 예약</span>
              <strong>{reservationsQuery.data.length}</strong>
            </article>
            <article className="metric-card">
              <span>확정 예약</span>
              <strong>
                {reservationsQuery.data.filter((reservation) => reservation.status === 'CONFIRMED').length}
              </strong>
            </article>
            <article className="metric-card">
              <span>취소 예약</span>
              <strong>
                {reservationsQuery.data.filter((reservation) => reservation.status === 'CANCELED').length}
              </strong>
            </article>
            <article className="metric-card">
              <span>총 예약 금액</span>
              <strong>
                {formatCurrency(
                  reservationsQuery.data.reduce((sum, reservation) => sum + reservation.totalPrice, 0),
                )}
              </strong>
            </article>
          </div>
          <div className="list-stack">
            {reservationsQuery.data.map((reservation) => (
              <article className="reservation-item" key={reservation.id}>
                <img src={reservation.roomImageUrl} alt={`${reservation.roomName} 대표 이미지`} />
                <div className="reservation-content">
                  <div className="row-between">
                    <h2>{reservation.roomName}</h2>
                    <StatusBadge>{reservation.status}</StatusBadge>
                  </div>
                  <p className="muted">
                    {reservation.guestName ?? '게스트'} · {formatDate(reservation.checkIn)} -{' '}
                    {formatDate(reservation.checkOut)}
                  </p>
                  <strong>{formatCurrency(reservation.totalPrice)}</strong>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
