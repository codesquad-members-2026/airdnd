import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { formatCurrency } from '../../../shared/lib/format';
import { RoomSummary } from '../../rooms/model/roomTypes';

const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/600x400?text=No+Image';

interface RoomMapInfoCardProps {
  room: RoomSummary;
  onClose: () => void;
}

// 마커 클릭 시 뜨는 미리보기 카드(Claude Design 핸드오프의 info-card).
export function RoomMapInfoCard({ room, onClose }: RoomMapInfoCardProps) {
  return (
    <div className="map-infocard" role="dialog" aria-label={room.name}>
      <div className="map-infocard__arrow" />
      <div className="map-infocard__media">
        <Link to={`/rooms/${room.id}`}>
          <img src={room.imageUrl || PLACEHOLDER_IMAGE_URL} alt="" loading="lazy" />
        </Link>
        <button type="button" className="map-infocard__close" onClick={onClose} aria-label="닫기">
          <X size={15} />
        </button>
        {!room.isAvailable ? <span className="map-infocard__badge">예약 마감</span> : null}
        {room.allowsPets && room.isAvailable ? (
          <span className="map-infocard__chip">반려동물 OK</span>
        ) : null}
      </div>
      <Link className="map-infocard__body" to={`/rooms/${room.id}`}>
        <h3 className="map-infocard__title">{room.name}</h3>
        <p className="map-infocard__meta">
          {room.region} · 최대 {room.maxGuests}명
        </p>
        <p className="map-infocard__price">
          <strong>{formatCurrency(room.pricePerNight)}</strong> <span>/ 박</span>
        </p>
      </Link>
    </div>
  );
}
