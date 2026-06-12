import { Star, UserCircle2 } from 'lucide-react';
import { Review } from '../model/reviewTypes';
import { formatDate } from '../../../shared/lib/format';

interface ReviewItemProps {
  review: Review;
}

export function ReviewItem({ review }: ReviewItemProps) {
  return (
    <article className="review-item">
      <div className="review-author">
        <span className="avatar-fallback" aria-hidden="true">
          <UserCircle2 size={22} />
        </span>
        <div>
          <div className="review-author-name">{review.authorName || '익명'}</div>
          <div className="review-date">{formatDate(review.createdAt)}</div>
        </div>
      </div>
      <div className="review-stars" aria-label={`별점 ${review.rating}점`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={13}
            className={i < review.rating ? 'is-on' : 'is-off'}
            fill={i < review.rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
      <p className="review-comment">{review.comment}</p>
    </article>
  );
}
