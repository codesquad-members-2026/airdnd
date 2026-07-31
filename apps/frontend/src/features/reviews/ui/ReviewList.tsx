import { useState } from 'react';
import { ChevronRight, Star } from 'lucide-react';
import { useRoomReviewsQuery } from '../api/reviewsQueries';
import { ReviewItem } from './ReviewItem';
import { ReviewSortDropdown } from './ReviewSortDropdown';
import type { ReviewSortKey } from './ReviewSortDropdown';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import { Loading } from '../../../shared/ui/Loading';
import { Modal } from '../../../shared/ui/Modal';

interface ReviewListProps {
  roomId: number;
  rating?: number; // 백엔드가 집계해 내려준 평균 평점 (모달 헤더 표시용)
}

// 가로 2개씩 4줄 = 8개까지만 먼저 보여주고, 그 이상은 '후기 더보기'로 모달에서 전체를 본다
const INITIAL_VISIBLE_COUNT = 8;

export function ReviewList({ roomId, rating }: ReviewListProps) {
  const { data: reviews, isLoading, error } = useRoomReviewsQuery(roomId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<ReviewSortKey>('latest');

  if (isLoading) {
    return <Loading message="후기를 불러오는 중입니다." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        title="아직 작성된 후기가 없습니다."
        description="이 숙소에 머문 게스트의 첫 후기를 기다리고 있어요."
      />
    );
  }

  const hasMore = reviews.length > INITIAL_VISIBLE_COUNT;
  const visibleReviews = reviews.slice(0, INITIAL_VISIBLE_COUNT);

  // 모달 안에서만 정렬을 적용한다 (원본 순서는 섹션 미리보기 유지)
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortKey) {
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'latest':
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });

  return (
    <section className="review-section">
      <h2>후기 {reviews.length}개</h2>
      <div className="review-grid">
        {visibleReviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>

      {hasMore && (
        <button type="button" onClick={() => setIsModalOpen(true)} className="detail-more-button tight">
          후기 {reviews.length}개 모두 보기 <ChevronRight size={16} />
        </button>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ariaLabel="전체 후기"
        maxWidth={680}
      >
        {/* 헤더: 별점 평균 + 후기 개수 (좌) / 정렬 드롭다운 (우) */}
        <div className="review-modal-head">
          <div className="review-modal-head__rating">
            <Star size={20} fill="currentColor" />
            <span>
              {rating != null ? `${rating.toFixed(2)} · ` : ''}후기 {reviews.length}개
            </span>
          </div>
          <ReviewSortDropdown value={sortKey} onChange={setSortKey} />
        </div>

        {/* 본문: 전체 후기를 1열로, 길어지면 모달 안에서 스크롤 */}
        <div className="detail-modal-scroll md">
          <div className="review-modal-list">
            {sortedReviews.map((review) => (
              <div key={review.id} className="review-modal-row">
                <ReviewItem review={review} />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </section>
  );
}
