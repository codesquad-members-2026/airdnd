import { createElement, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { RoomDetail } from '../model/roomTypes';
import { getAmenityIcon } from '../model/amenities';
import { Modal } from '../../../shared/ui/Modal';

// 가로 2개씩 4줄 = 8개까지만 먼저 보여주고, 그 이상은 '모두 보기'로 모달에서 전체를 본다
const INITIAL_VISIBLE_COUNT = 8;

function AmenityItem({ amenity }: { amenity: string }) {
  // getAmenityIcon returns a stable lucide component from a lookup table.
  // Render it via createElement (not a render-scoped <Icon/>) so the React
  // Compiler lint doesn't flag it as a component created during render.
  const icon = getAmenityIcon(amenity);
  return (
    <div className="amenity-tile">
      <span className="amenity-tile__icon">
        {createElement(icon, { size: 20, strokeWidth: 1.8 })}
      </span>
      {amenity}
    </div>
  );
}

export function RoomAmenities({ room }: { room: RoomDetail }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!room.amenities || room.amenities.length === 0) return null;

  const amenities = room.amenities;
  const hasMore = amenities.length > INITIAL_VISIBLE_COUNT;
  const visibleAmenities = amenities.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <section>
      <h2 className="room-amenities__title">숙소 편의시설</h2>
      <div className="room-amenities-grid">
        {visibleAmenities.map((amenity) => (
          <AmenityItem key={amenity} amenity={amenity} />
        ))}
      </div>

      {hasMore && (
        <button type="button" onClick={() => setIsModalOpen(true)} className="detail-more-button">
          편의시설 {amenities.length}개 모두 보기 <ChevronRight size={16} />
        </button>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ariaLabel="편의시설 전체 보기"
        maxWidth={680}
      >
        {/* 헤더 */}
        <div className="amenity-modal-head">편의시설 {amenities.length}개</div>

        {/* 본문: 전체 편의시설을 2열로, 길어지면 모달 안에서 스크롤 */}
        <div className="detail-modal-scroll md">
          <div className="room-amenities-grid">
            {amenities.map((amenity) => (
              <AmenityItem key={amenity} amenity={amenity} />
            ))}
          </div>
        </div>
      </Modal>
    </section>
  );
}
