// 백엔드 근사 카운트 상한(ListingQueryRepositoryImpl.COUNT_CAP)과 동일.
// count 쿼리는 이 값까지만 세므로, 도달하면 정확한 총개수를 알 수 없다.
export const COUNT_CAP = 1001;

// 상한에 도달했으면 "1,000+" 로, 그 미만이면 받은 개수를 그대로 노출한다.
export function formatResultCount(count: number): string {
  if (count >= COUNT_CAP) {
    return `${(COUNT_CAP - 1).toLocaleString('ko-KR')}+`;
  }
  return count.toLocaleString('ko-KR');
}
