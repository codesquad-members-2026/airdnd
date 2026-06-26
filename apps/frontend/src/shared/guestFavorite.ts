// 게스트 선호 배지 노출 기준: 평점 4.5 이상 그리고 후기 10개 이상
export const GUEST_FAVORITE_MIN_RATING = 4.5;
export const GUEST_FAVORITE_MIN_REVIEWS = 10;

export function isGuestFavorite(rating: number, reviews: number): boolean {
  return rating >= GUEST_FAVORITE_MIN_RATING && reviews >= GUEST_FAVORITE_MIN_REVIEWS;
}
