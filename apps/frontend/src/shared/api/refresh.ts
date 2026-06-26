import { API_BASE } from './config';

/**
 * 액세스 토큰 재발급(/api/auth/refresh) 단일 진입점.
 *
 * 백엔드는 액세스 토큰이 만료되면 보호 API에서 401을 돌려준다. 이때 곧장 로그아웃하지 않고
 * 쿠키의 리프레시 토큰으로 새 액세스/리프레시 토큰을 발급받아(회전) 원래 요청을 재시도한다.
 * 이 모듈은 "재발급 호출"만 책임지고, 401 감지·재시도는 {@link ./http refreshingFetch}가 맡는다.
 */

// 동시에 여러 요청이 401을 맞아도 /refresh 는 한 번만 호출되도록 진행 중인 프라미스를 공유한다(single-flight).
// 두 번째 이후 호출자는 같은 프라미스를 함께 기다리므로 리프레시 토큰이 중복 회전되지 않는다.
let inFlight: Promise<boolean> | null = null;

// 재발급이 끝내 실패(리프레시 만료/무효/탈취)했을 때 앱에 알린다. AppState가 구독해 로그인 상태를 내린다.
type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();

/** 재발급 최종 실패 시 호출될 콜백을 등록한다. 반환된 함수로 구독을 해제한다. */
export function onSessionExpired(cb: Listener): () => void {
  sessionExpiredListeners.add(cb);
  return () => {
    sessionExpiredListeners.delete(cb);
  };
}

/**
 * 액세스 토큰을 재발급한다. 성공하면 새 토큰 쿠키가 응답에 실려 내려온다(httpOnly라 JS는 값을 보지 못한다).
 *
 * @returns 재발급 성공 여부. 실패(401 등)면 false 이며, 구독자에게 세션 만료를 통지한다.
 */
export function refreshAccessToken(): Promise<boolean> {
  // 이미 재발급이 진행 중이면 그 결과를 함께 기다린다.
  if (inFlight) return inFlight;

  inFlight = fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // 리프레시 토큰 쿠키 동봉
  })
    .then((res) => res.ok)
    .catch(() => false)
    .then((ok) => {
      if (!ok) notifySessionExpired();
      return ok;
    })
    .finally(() => {
      inFlight = null; // 다음 만료 때 다시 재발급할 수 있도록 비운다
    });

  return inFlight;
}

function notifySessionExpired() {
  sessionExpiredListeners.forEach((cb) => cb());
}
