import { refreshAccessToken } from './refresh';

/**
 * 401(액세스 토큰 만료/누락) 시 자동으로 토큰을 재발급하고 1회 재시도하는 fetch 래퍼.
 *
 * 표준 fetch 와 같은 시그니처라 두 곳에 그대로 끼울 수 있다:
 *  - 손으로 짠 API 헬퍼/컴포넌트의 fetch 대체
 *  - 자동생성 클라이언트의 `client.setConfig({ fetch: refreshingFetch })`
 *
 * 동작: 요청 → 401 이면 재발급 시도 → 성공하면 동일 요청 재시도, 실패하면 원래의 401 그대로 반환.
 */

// 401 이어도 재발급을 시도하면 안 되는 경로(무한 루프/오작동 방지).
// - /api/auth/refresh: 재발급 자체. 여기서 또 재발급하면 무한 루프.
// - /api/auth/login, /signup, /logout: 자격 증명 오류의 401 이지 액세스 만료가 아니다.
const NO_REFRESH_PATHS = ['/api/auth/refresh', '/api/auth/login', '/api/auth/signup', '/api/auth/logout'];

function isRefreshable(url: string): boolean {
  return !NO_REFRESH_PATHS.some((p) => url.includes(p));
}

export const refreshingFetch: typeof fetch = async (input, init) => {
  // Request 본문은 한 번만 읽을 수 있으므로, 보내기 전에 재시도용 복제본을 만들어 둔다.
  // (input 이 문자열이든 Request 든 동일하게 동작)
  const request = new Request(input as RequestInfo, init);
  const retryRequest = request.clone();

  const response = await fetch(request);

  if (response.status !== 401 || !isRefreshable(request.url)) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return response; // 재발급 실패 → 원래 401 그대로(호출부가 평소처럼 처리/로그아웃)
  }

  // 새 액세스 토큰 쿠키로 원 요청을 1회 재시도한다.
  return fetch(retryRequest);
};
