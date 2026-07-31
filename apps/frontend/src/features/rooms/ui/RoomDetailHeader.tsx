import { Share } from 'lucide-react';
import { RoomDetail } from '../model/roomTypes';
import { AddToWishlistButton } from '../../wishlist/ui/AddToWishlistButton';

export function RoomDetailHeader({ room }: { room: RoomDetail }) {
  return (
    <section className="room-detail-header">
      <h1 className="room-detail-header__title">{room.name}</h1>
      <div className="room-detail-header__actions">
        <button className="room-detail-header__share">
          <Share size={16} /> 공유하기
        </button>
        <AddToWishlistButton roomId={room.id} variant="text" />
      </div>
    </section>
  );
}
