import { Link } from 'react-router-dom';
import { formatCurrency } from '../../../shared/lib/format';
import { RoomSummary } from '../model/roomTypes';
import { RoomReviewBadge } from '../../reviews/ui/RoomReviewBadge';
import { AddToWishlistButton } from '../../wishlist/ui/AddToWishlistButton';

export function RoomCard({ room }: { room: RoomSummary }) {
  return (
    <article className="room-card">
      <AddToWishlistButton roomId={room.id} className="room-card-save" />
      <Link to={`/rooms/${room.id}`}>
        <div className="room-card-media">
          <img src={room.imageUrl} alt={`${room.name} 대표 이미지`} />
        </div>
        <div className="room-card-body">
          <div className="room-card-title-row">
            <h2>{room.name}</h2>
            {/* 백엔드가 집계해 내려준 평점을 표시 */}
            <RoomReviewBadge rating={room.rating} reviewCount={room.reviewCount} showReviewCount={false} />
          </div>
          <div className="room-card-info">
            <p className="room-card-location muted">
              {room.region} · 최대 {room.maxGuests}명
            </p>
            <p className="room-price">
              <strong>{formatCurrency(room.pricePerNight)}</strong>
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
