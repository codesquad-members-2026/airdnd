import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../../shared/lib/format';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { StatusBadge } from '../../../shared/ui/StatusBadge';
import { Reservation } from '../model/reservationTypes';

type ReservationListProps = {
  reservations: Reservation[];
  onCancel: (reservationId: number) => void;
  isCanceling?: boolean;
};

const statusText = {
  PENDING: '대기',
  CONFIRMED: '확정',
  CANCELED: '취소',
};

export function ReservationList({
  reservations,
  onCancel,
  isCanceling = false,
}: ReservationListProps) {
  if (reservations.length === 0) {
    return <EmptyState title="예약 내역이 없습니다." description="숙소 상세 화면에서 예약을 생성하세요." />;
  }

  return (
    <div className="list-stack">
      {reservations.map((reservation) => (
        <article className="reservation-item" key={reservation.id}>
          <img src={reservation.roomImageUrl} alt={`${reservation.roomName} 대표 이미지`} />
          <div className="reservation-content">
            <div className="row-between">
              <Link to={`/reservations/${reservation.id}`}>
                <h2>{reservation.roomName}</h2>
              </Link>
              <StatusBadge>{statusText[reservation.status]}</StatusBadge>
            </div>
            <p className="muted">
              {formatDate(reservation.checkIn)} - {formatDate(reservation.checkOut)} ·{' '}
              {reservation.guests}명
            </p>
            <strong>{formatCurrency(reservation.totalPrice)}</strong>
          </div>
          <button
            type="button"
            className="secondary-button"
            disabled={isCanceling || reservation.status === 'CANCELED'}
            onClick={() => onCancel(reservation.id)}
          >
            예약 취소
          </button>
        </article>
      ))}
    </div>
  );
}
