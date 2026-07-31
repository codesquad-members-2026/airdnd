import { useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { RoomDetail } from '../model/roomTypes';
import { Modal } from '../../../shared/ui/Modal';

// 이 글자 수를 넘으면 본문을 잘라서 보여주고 '더 보기'로 전체를 노출
const PREVIEW_LIMIT = 180;

export function RoomDescription({ room }: { room: RoomDetail }) {
  const description = room.description?.trim();
  const [showFull, setShowFull] = useState(false);

  // 설명이 없으면 섹션 자체를 렌더하지 않음
  if (!description) return null;

  // 글자 수 기준으로 미리보기를 자름 (단어 중간이 잘려도 '…'로 자연스럽게 처리)
  const isLong = description.length > PREVIEW_LIMIT;
  const preview = isLong ? `${description.slice(0, PREVIEW_LIMIT).trimEnd()}…` : description;

  return (
    <section className="room-description">
      <h2 className="room-description__title">숙소 소개</h2>

      <p className="room-description__text">{preview}</p>

      {isLong && (
        <button type="button" onClick={() => setShowFull(true)} className="room-description__more">
          더 보기 <ChevronRight size={16} />
        </button>
      )}

      <Modal open={showFull} onClose={() => setShowFull(false)} ariaLabel="숙소 소개" maxWidth={640}>
        {/* 헤더: 아이콘 + 타이틀, 아래 구분선 */}
        <div className="detail-modal-head">
          <span className="detail-modal-head__icon">
            <Home size={20} strokeWidth={1.8} />
          </span>
          <h2 className="detail-modal-head__title">숙소 소개</h2>
        </div>

        {/* 본문: 길어지면 모달 안에서 스크롤 */}
        <div className="detail-modal-scroll sm">
          <p className="room-description__full">{description}</p>
        </div>
      </Modal>
    </section>
  );
}
