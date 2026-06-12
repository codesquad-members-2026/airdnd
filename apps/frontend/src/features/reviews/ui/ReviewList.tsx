import { useRoomReviewsQuery } from '../api/reviewsQueries';
import { ReviewItem } from './ReviewItem';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import { Loading } from '../../../shared/ui/Loading';

interface ReviewListProps {
  roomId: number;
}

export function ReviewList({ roomId }: ReviewListProps) {
  const { data: reviews, isLoading, error } = useRoomReviewsQuery(roomId);

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

  return (
    <section className="review-section">
      <h2>후기 {reviews.length}개</h2>
      <div className="review-grid">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}
