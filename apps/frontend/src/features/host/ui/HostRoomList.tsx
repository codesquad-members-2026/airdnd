import { Link } from 'react-router-dom';
import { MapPin, Users, Pencil, Eye, EyeOff, CalendarCheck } from 'lucide-react';
import { formatCurrency } from '../../../shared/lib/format';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { HostRoom, HostRoomStatus } from '../model/hostRoomTypes';

type HostRoomListProps = {
  rooms: HostRoom[];
  pendingRoomId?: number;
  onStatusChange: (roomId: number, status: HostRoomStatus) => void;
};

const statusText: Record<HostRoomStatus, string> = {
  ACTIVE: '운영 중',
  INACTIVE: '비활성화',
  PENDING_APPROVAL: '승인 대기',
};

const statusModifier: Record<HostRoomStatus, string> = {
  ACTIVE: 'is-active',
  INACTIVE: 'is-inactive',
  PENDING_APPROVAL: 'is-pending',
};

export function HostRoomList({ rooms, pendingRoomId, onStatusChange }: HostRoomListProps) {
  if (rooms.length === 0) {
    return <EmptyState title="등록한 숙소가 없습니다." description="첫 숙소를 등록해 보세요." />;
  }

  return (
    <div className="host-room-grid">
      {rooms.map((room) => {
        const isActive = room.status === 'ACTIVE';
        const isPending = pendingRoomId === room.id;
        const amenityCount = room.amenities?.length ?? 0;

        return (
          <article className="host-room-card" key={room.id}>
            <div className="host-room-media">
              <img src={room.imageUrl} alt={`${room.name} 대표 이미지`} />
            </div>
            <div className="host-room-body">
              <div className="host-room-top">
                <h2>{room.name}</h2>
                <span className={`host-status ${statusModifier[room.status]}`}>
                  {statusText[room.status]}
                </span>
              </div>
              <p className="host-room-loc">
                <MapPin size={15} strokeWidth={1.8} aria-hidden />
                {room.region}
              </p>
              <div className="host-room-meta">
                <span>
                  <Users size={15} strokeWidth={1.8} aria-hidden />
                  최대 {room.maxGuests}명
                </span>
                {amenityCount > 0 ? <span>편의시설 {amenityCount}개</span> : null}
              </div>
              <p className="host-room-price">{formatCurrency(room.pricePerNight)}</p>
            </div>
            <div className="host-room-actions">
              <Link className="secondary-button" to={`/host/rooms/${room.id}/reservations`}>
                <CalendarCheck size={16} strokeWidth={1.9} aria-hidden />
                예약 현황
              </Link>
              <Link className="secondary-button" to={`/host/rooms/${room.id}/edit`}>
                <Pencil size={16} strokeWidth={1.9} aria-hidden />
                수정
              </Link>
              <button
                type="button"
                className={`secondary-button host-toggle ${isActive ? 'is-on' : ''}`}
                disabled={isPending}
                onClick={() => onStatusChange(room.id, isActive ? 'INACTIVE' : 'ACTIVE')}
              >
                {isActive ? (
                  <EyeOff size={16} strokeWidth={1.9} aria-hidden />
                ) : (
                  <Eye size={16} strokeWidth={1.9} aria-hidden />
                )}
                {isPending ? '처리 중...' : isActive ? '비활성화' : '활성화'}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
