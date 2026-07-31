import { useParams } from 'react-router-dom';
import { ReservationForm } from '../../features/reservations/ui/ReservationForm';
import { useRoomQuery } from '../../features/rooms/api/roomsQueries';
import { RoomDetailHeader } from '../../features/rooms/ui/RoomDetailHeader';
import { RoomGallery } from '../../features/rooms/ui/RoomGallery';
import { RoomOverview } from '../../features/rooms/ui/RoomOverview';
import { RoomDescription } from '../../features/rooms/ui/RoomDescription';
import { RoomAmenities } from '../../features/rooms/ui/RoomAmenities';
import { RoomLocation } from '../../features/rooms/ui/RoomLocation';
import { ReviewList } from '../../features/reviews/ui/ReviewList';
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

  return (
    <div className="room-detail-page">
      <div className="room-detail-page__inner">

        {/* A. 제목 및 액션 버튼 */}
        <RoomDetailHeader room={room} />

        {/* B. 와이드 사진 갤러리 */}
        <RoomGallery room={room} />

        {/* 사진 영역과 본문을 구분하는 라인 */}
        <hr className="room-detail-divider" />

        {/* 메인 레이아웃 (좌: 정보 / 우: 예약창) — 예약 폼은 이 그리드 안에서만 따라온다 */}
        <div className="room-detail-main">

          {/* 좌측: 숙소 정보 */}
          <article>
            {/* C. 호스트 정보 + 숙소 하이라이트 */}
            <RoomOverview room={room} />

            {/* D. 설명 */}
            <RoomDescription room={room} />

            {/* E. 편의시설 */}
            <RoomAmenities room={room} />
          </article>

          {/* H. 우측: 스티키 예약 폼 */}
          <aside className="room-detail-aside">
            <div className="room-detail-sticky">
              <ReservationForm room={room} />
            </div>
          </aside>

        </div>

        {/* 편의시설과 위치 사이 전체 너비 구분선 */}
        <hr className="room-detail-divider wide" />

        {/* F. 숙소 위치 (실제 지도 연동) — 전체 너비 */}
        <RoomLocation room={room} />

        {/* G. 후기 섹션 — 전체 너비 */}
        <section id="reviews" className="room-detail-reviews">
          <ReviewList roomId={parsedRoomId} rating={room.rating} />
        </section>
      </div>
    </div>
  );
}
