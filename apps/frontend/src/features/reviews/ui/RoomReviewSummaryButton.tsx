import { Star } from 'lucide-react';

// 평점(0~5)에 비례해 5개의 별을 부분적으로 채워 그리는 컴포넌트
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const percent = Math.max(0, Math.min(100, (rating / 5) * 100));
  const stars = [0, 1, 2, 3, 4];

  return (
    <span className="star-rating">
      {/* 바탕: 비어 있는(회색) 별 */}
      <span className="star-rating__base">
        {stars.map((i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
      {/* 덧칠: 평점만큼 가로로 잘라낸 채워진 별 */}
      <span className="star-rating__fill" style={{ width: `${percent}%` }}>
        {stars.map((i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
    </span>
  );
}

interface RoomReviewSummaryButtonProps {
  rating?: number; // 백엔드가 집계해 내려준 평균 평점
  reviewCount?: number; // 백엔드가 집계해 내려준 후기 수
  fullWidth?: boolean; // 가로 전체로 늘릴지 여부
}

// 후기 섹션으로 부드럽게 스크롤 이동
function scrollToReviews() {
  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function RoomReviewSummaryButton({ rating, reviewCount, fullWidth = false }: RoomReviewSummaryButtonProps) {
  // 평점이 없거나 후기가 0개면 버튼을 노출하지 않음
  if (rating == null || !reviewCount) return null;

  // 가로로 늘릴 때는 '에어디엔디 선정' 배너 형태:
  // 좌측에 선정 문구, 우측에 [평점(숫자+별) | 후기]를 세로 구분선으로 구분
  if (fullWidth) {
    return (
      <button type="button" onClick={scrollToReviews} className="review-summary-btn full">
        {/* 좌측: 선정 문구 */}
        <span className="review-summary__left">
          <span className="review-summary__eyebrow">에어디엔디 선정</span>
          <span className="review-summary__headline">게스트에게 가장 사랑받는 숙소</span>
        </span>

        {/* 우측: 평점 | 후기 */}
        <span className="review-summary__right">
          {/* 평점: 위 숫자, 아래 별 */}
          <span className="review-summary__metric">
            <span className="review-summary__value">{rating.toFixed(1)}</span>
            <StarRating rating={rating} />
          </span>

          {/* 평점과 후기 사이 세로 구분선 */}
          <span className="review-summary__divider" />

          {/* 후기: 위 개수, 아래 라벨 */}
          <span className="review-summary__metric">
            <span className="review-summary__value">{reviewCount}</span>
            <span className="review-summary__label">후기</span>
          </span>
        </span>
      </button>
    );
  }

  return (
    <button type="button" onClick={scrollToReviews} className="review-summary-btn">
      <Star size={16} fill="#222" strokeWidth={0} />
      <span>{rating.toFixed(1)}</span>
      <span className="review-summary__dot">·</span>
      <span className="review-summary__count">후기 {reviewCount}개</span>
    </button>
  );
}
