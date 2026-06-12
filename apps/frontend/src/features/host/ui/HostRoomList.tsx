import { Link } from 'react-router-dom';
import { formatCurrency } from '../../../shared/lib/format';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { StatusBadge } from '../../../shared/ui/StatusBadge';
import { HostRoom, HostRoomStatus } from '../model/hostRoomTypes';

type HostRoomListProps = {
  rooms: HostRoom[];
  onStatusChange: (roomId: number, status: HostRoomStatus) => void;
};

const statusText = {
  ACTIVE: '운영 중',
  INACTIVE: '비활성화',
  PENDING_APPROVAL: '승인 대기',
};

export function HostRoomList({ rooms, onStatusChange }: HostRoomListProps) {
  if (rooms.length === 0) {
    return <EmptyState title="등록한 숙소가 없습니다." description="첫 숙소를 등록해 보세요." />;
  }

  return (
    <div className="list-stack">
      {rooms.map((room) => (
        <article className="reservation-item" key={room.id}>
          <img src={room.imageUrl} alt={`${room.name} 대표 이미지`} />
          <div className="reservation-content">
            <div className="row-between">
              <h2>{room.name}</h2>
              <StatusBadge>{statusText[room.status]}</StatusBadge>
            </div>
            <p className="muted">
              {room.region} · 최대 {room.maxGuests}명
            </p>
            <strong>{formatCurrency(room.pricePerNight)} / 박</strong>
          </div>
          <div className="button-group">
            <Link className="secondary-button" to={`/host/rooms/${room.id}/edit`}>
              수정
            </Link>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                onStatusChange(room.id, room.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
              }
            >
              {room.status === 'ACTIVE' ? '비활성화' : '활성화'}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
