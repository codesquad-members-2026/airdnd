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
            {/* 개별적으로 리뷰 요약 API를 호출하여 별점 표시 */}
            <RoomReviewBadge roomId={room.id} showReviewCount={false} />
          </div>
          <p className="muted">{room.region} · 최대 {room.maxGuests}명</p>
          <p className="room-price">
            {formatCurrency(room.pricePerNight)}
            <span> / 박</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
