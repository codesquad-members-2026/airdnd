import { Star } from 'lucide-react';
import { useMemo } from 'react';
import { useRoomReviewsQuery } from '../api/reviewsQueries';

interface RoomReviewBadgeProps {
  roomId: number;
  showReviewCount?: boolean; // 메인 리스트에선 숨기고 상세 페이지에선 보이게 제어 가능
}

export function RoomReviewBadge({ roomId, showReviewCount = true }: RoomReviewBadgeProps) {
  const { data: reviews, isLoading, isError } = useRoomReviewsQuery(roomId);

  const summary = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;

    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return {
      rating: Math.round((sum / reviews.length) * 10) / 10,
      reviewCount: reviews.length,
    };
  }, [reviews]);

  if (isLoading) {
    return (
      <span className="rating-inline" aria-hidden="true">
        <Star size={14} fill="currentColor" />
        <span className="rating-skeleton" />
      </span>
    );
  }

  if (isError || !summary) {
    return <span className="rating-inline rating-empty">신규</span>;
  }

  return (
    <span className="rating-inline">
      <Star size={14} fill="currentColor" />
      {summary.rating.toFixed(1)}
      {showReviewCount ? <span className="review-count">· 리뷰 {summary.reviewCount}개</span> : null}
    </span>
  );
}
