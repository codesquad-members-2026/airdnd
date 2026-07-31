import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Grid3x3, X } from 'lucide-react';
import { RoomDetail } from '../model/roomTypes';
import { Modal } from '../../../shared/ui/Modal';

export function RoomGallery({ room }: { room: RoomDetail }) {
  // 대표 사진은 필수. 나머지는 추가 사진으로 최대 4장까지 노출
  const allImages = room.imageUrls && room.imageUrls.length > 0 ? room.imageUrls : [room.imageUrl];
  const heroImage = allImages[0];
  const sideImages = allImages.slice(1, 5);
  const sideCount = sideImages.length;

  // 대표 사진 포함 6장 이상일 때만 '사진 모두 모아보기' 버튼 노출 (5장 이하는 미노출)
  const hasMore = allImages.length >= 6;
  const [showAll, setShowAll] = useState(false);
  // 라이트박스: 그리드 썸네일 클릭 시 해당 사진을 원본 비율 전체로 표시 (null이면 닫힘)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // 라이트박스가 열려 있는 동안 ESC 로 닫기 + 좌우 방향키로 이전/다음 이동
  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setLightboxIndex(null);
      if (event.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? i : (i + 1) % allImages.length));
      if (event.key === 'ArrowLeft')
        setLightboxIndex((i) => (i === null ? i : (i - 1 + allImages.length) % allImages.length));
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, allImages.length]);

  return (
    <section className={`room-gallery${sideCount === 0 ? ' solo' : ''}`}>
      {/* 대표 사진 (Hero) */}
      <div className="room-gallery-hero">
        <img src={heroImage} alt={`${room.name} 대표 사진`} className="room-gallery-img" />
      </div>

      {/* 추가 사진 그리드 (있을 때만) */}
      {sideCount > 0 && (
        <div className={`room-gallery-side${sideCount > 2 ? ' cols-2' : ''}${sideCount > 1 ? ' rows-2' : ''}`}>
          {sideImages.map((img, index) => (
            <div key={index} className="room-gallery-side-cell">
              <img src={img} alt={`${room.name} 사진 ${index + 2}`} className="room-gallery-img" />
            </div>
          ))}
        </div>
      )}

      {/* 사진 모두 모아보기 버튼 (추가 사진 4장 이상일 때만) */}
      {hasMore && (
        <button type="button" onClick={() => setShowAll(true)} className="room-gallery-more">
          <Grid3x3 size={16} strokeWidth={2} />
          사진 모두 보기
        </button>
      )}

      {/* 전체 사진 모아보기 팝업 */}
      <Modal open={showAll} onClose={() => setShowAll(false)} ariaLabel="사진 모두 보기" maxWidth={880}>
        {/* 헤더: 타이틀, 아래 구분선 */}
        <div className="detail-modal-head">
          <span className="detail-modal-head__icon">
            <Grid3x3 size={20} strokeWidth={1.8} />
          </span>
          <h2 className="detail-modal-head__title">사진 {allImages.length}장</h2>
        </div>

        {/* 본문: 모든 이미지를 그리드로, 길어지면 모달 안에서 스크롤 */}
        <div className="detail-modal-scroll">
          <div className="gallery-modal-grid">
            {allImages.map((img, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={`${room.name} 사진 ${index + 1} 원본 보기`}
                className="gallery-modal-thumb"
              >
                <img src={img} alt={`${room.name} 사진 ${index + 1}`} className="room-gallery-img" />
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* 라이트박스: 클릭한 사진을 원본 비율 그대로 전체 화면에 표시 (잘림 없음) */}
      {lightboxIndex !== null &&
        createPortal(
          <div onClick={() => setLightboxIndex(null)} className="lightbox">
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="닫기"
              className="lightbox__close"
            >
              <X size={22} />
            </button>

            <img
              src={allImages[lightboxIndex]}
              alt={`${room.name} 사진 ${lightboxIndex + 1} 원본`}
              onClick={(event) => event.stopPropagation()}
              className="lightbox__img"
            />

            {/* 사진 순번 표시 */}
            <span className="lightbox__counter">
              {lightboxIndex + 1} / {allImages.length}
            </span>
          </div>,
          document.body,
        )}
    </section>
  );
}
