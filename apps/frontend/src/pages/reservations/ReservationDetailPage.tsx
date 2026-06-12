import { Link, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, UsersRound } from 'lucide-react';
import { useReservationQuery } from '../../features/reservations/api/reservationsQueries';
import { formatCurrency, formatDate } from '../../shared/lib/format';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';
import { StatusBadge } from '../../shared/ui/StatusBadge';

export function ReservationDetailPage() {
  const { reservationId } = useParams();
  const parsedReservationId = Number(reservationId);
  const reservationQuery = useReservationQuery(parsedReservationId);

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

  return (
    <section className="detail-layout">
      <article className="stack detail-content">
        <img className="detail-hero" src={reservation.roomImageUrl} alt={`${reservation.roomName} 대표 이미지`} />
        <div className="detail-header">
          <div className="page-heading">
            <p className="eyebrow">Reservation</p>
            <h1>예약 확인</h1>
            <p className="muted">예약 번호 #{reservation.id}</p>
          </div>
          <StatusBadge>{reservation.status}</StatusBadge>
        </div>
        <div className="content-section">
          <h2>{reservation.roomName}</h2>
          <div className="info-row">
            <span>
              <MapPin size={16} /> {reservation.region ?? '지역 정보 없음'}
            </span>
            <span>
              <CalendarDays size={16} /> {formatDate(reservation.checkIn)} -{' '}
              {formatDate(reservation.checkOut)}
            </span>
            <span>
              <UsersRound size={16} /> {reservation.guests}명
            </span>
          </div>
        </div>
        <div className="content-section">
          <h2>결제 요약</h2>
          <div className="price-summary">
            <span>총 예약 금액</span>
            <strong>{formatCurrency(reservation.totalPrice)}</strong>
          </div>
        </div>
      </article>
      <aside className="reservation-panel">
        <h2>다음 단계</h2>
        <p className="muted">체크인 전 예약 정보와 알림을 확인하세요.</p>
        <Link className="secondary-button full-width" to="/reservations">
          예약 목록으로
        </Link>
      </aside>
    </section>
  );
}
