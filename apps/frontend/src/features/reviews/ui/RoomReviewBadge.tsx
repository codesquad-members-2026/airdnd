import { Star } from 'lucide-react';

interface RoomReviewBadgeProps {
  rating?: number; // 백엔드가 집계해 내려준 평균 평점
  reviewCount?: number; // 백엔드가 집계해 내려준 후기 수
  showReviewCount?: boolean; // 메인 리스트에선 숨기고 상세 페이지에선 보이게 제어 가능
}

export function RoomReviewBadge({ rating, reviewCount, showReviewCount = true }: RoomReviewBadgeProps) {
  // 평점이 없거나 후기가 0개면 '신규'로 표시
  if (rating == null || !reviewCount) {
    return <span className="rating-inline rating-empty">신규</span>;
  }

  return (
    <span className="rating-inline">
      <Star size={14} fill="currentColor" />
      {rating.toFixed(1)}
      {showReviewCount ? <span className="review-count">· 리뷰 {reviewCount}개</span> : null}
    </span>
  );
}
