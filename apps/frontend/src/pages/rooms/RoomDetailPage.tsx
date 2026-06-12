import { useParams } from 'react-router-dom';
import { MapPin, Share, UserRound } from 'lucide-react';
import { ReservationForm } from '../../features/reservations/ui/ReservationForm';
import { useRoomQuery } from '../../features/rooms/api/roomsQueries';
import { RoomReviewBadge } from '../../features/reviews/ui/RoomReviewBadge';
import { ReviewList } from '../../features/reviews/ui/ReviewList';
import { AddToWishlistButton } from '../../features/wishlist/ui/AddToWishlistButton';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';

export function RoomDetailPage() {
  const { roomId } = useParams();
  const parsedRoomId = Number(roomId);
  const roomQuery = useRoomQuery(parsedRoomId);

  if (roomQuery.isLoading) {
    return <Loading message="숙소 상세 정보를 불러오는 중입니다." />;
  }

  if (roomQuery.error) {
    return <ErrorMessage error={roomQuery.error} />;
  }

  if (!roomQuery.data) {
    return null;
  }

  const room = roomQuery.data;

  // 첫 번째 이미지를 대표로, 나머지를 사이드(최대 4개)로 사용합니다.
  const allImages = room.imageUrls && room.imageUrls.length > 0 ? room.imageUrls : [room.imageUrl];
  const heroImage = allImages[0];
  const sideImages = allImages.slice(1, 5);

  return (
    <div className="room-detail">
      <div className="detail-header-top">
        <div className="detail-title">
          <h1>{room.name}</h1>
          <RoomReviewBadge roomId={parsedRoomId} showReviewCount={true} />
        </div>
        <div className="detail-actions">
          <button type="button" className="link-button">
            <Share size={16} /> 공유하기
          </button>
          <AddToWishlistButton roomId={parsedRoomId} variant="text" />
        </div>
      </div>

      <div className={`detail-gallery ${sideImages.length === 0 ? 'single' : ''}`}>
        <img className="detail-hero" src={heroImage} alt={`${room.name} 대표 이미지`} />
        {sideImages.length > 0 ? (
          <div className="detail-gallery-side" aria-hidden="true">
            {sideImages.map((image, index) => (
              <img key={index} className="detail-gallery-tile" src={image} alt="" />
            ))}
          </div>
        ) : null}
      </div>

      <div className="detail-layout">
        <article className="detail-content">
          <div className="content-section detail-host">
            <div>
              <h2>호스트 {room.hostName}님이 호스팅하는 숙소</h2>
              <p className="muted">최대 인원 {room.maxGuests}명</p>
            </div>
            <span className="detail-host-avatar" aria-hidden="true">
              <UserRound size={28} strokeWidth={1.5} />
            </span>
          </div>

          <div className="content-section detail-location">
            <span className="detail-location-icon" aria-hidden="true">
              <MapPin size={20} />
            </span>
            <div>
              <h3>숙소 위치</h3>
              <p className="muted">{room.address}</p>
            </div>
          </div>

          <div className="content-section">
            <h2>숙소 소개</h2>
            <p className="detail-description">{room.description}</p>
          </div>

          <div className="content-section">
            <h2>숙소 편의시설</h2>
            <div className="amenity-grid">
              {room.amenities.map((amenity) => (
                <span className="amenity-item" key={amenity}>
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          <section id="reviews" className="content-section no-border">
            <ReviewList roomId={parsedRoomId} />
          </section>
        </article>

        <ReservationForm room={room} />
      </div>
    </div>
  );
}
