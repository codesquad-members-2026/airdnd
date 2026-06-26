import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LISTINGS } from './demoListings';
import { API_BASE } from './api/config';
import { refreshAccessToken, onSessionExpired } from './api/refresh';
import type { SearchState, Listing } from '../types';

/**
 * 로그인 후 이어서 실행할 동작을 "직렬화 가능한" 형태로 표현한다.
 * 폼 로그인은 메모리 클로저(afterLogin)로 즉시 처리하지만, OAuth(구글)는 전체 페이지
 * 리다이렉트라 메모리가 날아가므로, 이 intent 를 sessionStorage 에 저장했다가 복귀 후 재생한다.
 */
export type PendingIntent =
  | { type: 'reserve'; listingId: number; search: SearchState }
  // from: 하트를 누른 원래 경로. OAuth 는 항상 / 로 복귀하므로, 이 경로로 되돌린 뒤 저장 모달을 띄운다.
  | { type: 'saveHeart'; listingId: number; from: string }
  | { type: 'host' };

/** OAuth 왕복 동안 의도를 보관하는 sessionStorage 키 (같은 탭/오리진이면 크로스오리진 왕복 후에도 유지) */
const PENDING_INTENT_KEY = 'airdnd_pending_intent';

const DEFAULT_SEARCH: SearchState = {
  destination: '',
  region: null,
  dates: '',
  range: null,
  priceMin: null,
  priceMax: null,
  guests: { adult: 1, child: 0, infant: 0, pet: 0 },
  guestLabel: '',
};

/** 로그인 여부를 UI 표시용으로 기억하는 localStorage 키 (실제 인증은 세션 쿠키가 담당) */
const LOGIN_FLAG_KEY = 'airdnd_logged_in';

interface AppStateValue {
  search: SearchState;
  setSearch: (s: SearchState) => void;
  selectedListing: Listing;
  setSelectedListing: (l: Listing) => void;
  isLoggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
  /** 로그인 모달 전역 표시 상태. 401(세션 만료) 시 자동으로 열어 로그인을 유도한다. */
  loginOpen: boolean;
  /** 모달 상단에 띄울 안내 문구(예: "로그인이 필요해요"). 직접 로그인 클릭 시엔 null. */
  loginNotice: string | null;
  /**
   * 로그인 모달 열기.
   * @param notice 모달 상단 안내 배너 문구
   * @param afterLogin 폼 로그인 성공 시 즉시(같은 페이지에서) 이어서 실행할 동작. 취소(닫기)하면 폐기된다.
   * @param intent OAuth(구글) 로그인처럼 페이지가 리로드되는 경로에서 복귀 후 재생할 직렬화 가능한 의도.
   */
  openLogin: (notice?: string | null, afterLogin?: (() => void) | null, intent?: PendingIntent | null) => void;
  closeLogin: () => void;
  /** 보류 중인 로그인 후 동작을 실행하고 비운다. 실행했으면 true. (LoginModal 이 폼 로그인 성공 후 호출) */
  runAfterLogin: () => boolean;
  /** OAuth 로 떠나기 직전 호출. 현재 보류 intent 를 sessionStorage 에 저장해 복귀 후 재생되게 한다. */
  persistIntentForOAuth: () => void;
  /** OAuth 복귀 후 "그 자리에서" 저장 플로우를 실행할 대상 listingId (전역 저장 모달이 구독). 없으면 null. */
  pendingSaveHeart: number | null;
  clearPendingSaveHeart: () => void;
  canceledIds: Set<number>;
  cancelReservation: (id: number) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState<SearchState>(DEFAULT_SEARCH);
  const [selectedListing, setSelectedListing] = useState<Listing>(LISTINGS[0]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => localStorage.getItem(LOGIN_FLAG_KEY) === 'true'
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  // OAuth 복귀 후 그 자리에서 저장 모달을 띄울 대상 listingId. 전역 저장 플로우가 구독.
  const [pendingSaveHeart, setPendingSaveHeart] = useState<number | null>(null);
  const clearPendingSaveHeart = () => setPendingSaveHeart(null);
  // 로그인 성공 후 이어서 실행할 동작/의도. 렌더와 무관하게 최신값을 들고 있도록 ref 사용.
  const afterLoginRef = useRef<(() => void) | null>(null);
  const intentRef = useRef<PendingIntent | null>(null);

  // 의도를 네비게이션으로 재생한다(OAuth 복귀 후, 또는 폼 로그인 시 클로저가 없을 때의 대비책).
  const dispatchIntent = (intent: PendingIntent) => {
    switch (intent.type) {
      case 'host':
        navigate('/host');
        break;
      case 'reserve':
        setSearch(intent.search); // 로그인 전 고른 날짜/인원 복원
        navigate(`/listings/${intent.listingId}/checkout`);
        break;
      case 'saveHeart':
        // OAuth 는 항상 / 로 복귀하므로, 하트를 눌렀던 원래 경로로 되돌린 뒤
        // 그 자리에서 전역 저장 모달을 띄우도록 신호를 준다(GlobalSaveFlow 구독).
        if (intent.from && intent.from !== window.location.pathname) {
          navigate(intent.from);
        }
        setPendingSaveHeart(intent.listingId);
        break;
    }
  };

  const openLogin = (
    notice: string | null = null,
    afterLogin: (() => void) | null = null,
    intent: PendingIntent | null = null,
  ) => {
    setLoginNotice(notice);
    afterLoginRef.current = afterLogin;
    intentRef.current = intent;
    setLoginOpen(true);
  };
  const closeLogin = () => {
    setLoginOpen(false);
    setLoginNotice(null);
    afterLoginRef.current = null; // 취소 시 보류 동작 폐기
    intentRef.current = null;
  };
  const runAfterLogin = (): boolean => {
    const fn = afterLoginRef.current;
    afterLoginRef.current = null;
    intentRef.current = null; // 폼 로그인은 즉시 처리하므로 OAuth용 intent 는 폐기
    if (fn) {
      fn();
      return true;
    }
    return false;
  };
  const persistIntentForOAuth = () => {
    if (intentRef.current) {
      sessionStorage.setItem(PENDING_INTENT_KEY, JSON.stringify(intentRef.current));
    }
  };

  const setLoggedIn = (v: boolean) => {
    setIsLoggedIn(v);
    if (v) localStorage.setItem(LOGIN_FLAG_KEY, 'true');
    else localStorage.removeItem(LOGIN_FLAG_KEY);
  };

  // 앱 로드 시 서버 세션을 조회해 로그인 상태를 확정한다 (localStorage 플래그는 깜빡임 방지용 초기값일 뿐, 서버가 진실).
  useEffect(() => {
    let alive = true;

    // GET /api/auth/session → authenticated 여부. (permitAll 이라 401 대신 authenticated:false 로 응답)
    const checkSession = (): Promise<boolean> =>
      fetch(`${API_BASE}/api/auth/session`, { credentials: 'include' })
        .then((res) => res.json())
        .then((json) => Boolean(json?.data?.authenticated))
        .catch(() => false);

    (async () => {
      let authed = await checkSession();
      // 직전까지 로그인 상태였는데 미인증이면(=액세스 토큰 만료로 추정) 재발급을 시도하고 다시 확인한다.
      // → 리프레시 토큰(14일)이 살아있으면 새로고침해도 로그인이 끊기지 않는다.
      if (!authed && localStorage.getItem(LOGIN_FLAG_KEY) === 'true') {
        const refreshed = await refreshAccessToken();
        if (refreshed) authed = await checkSession();
      }
      if (!alive) return;
      setLoggedIn(authed);
      // OAuth 복귀: 로그인되어 있고 보류 intent 가 있으면 재생(예약/저장/호스팅). 1회만.
      if (authed) {
        const raw = sessionStorage.getItem(PENDING_INTENT_KEY);
        if (raw) {
          sessionStorage.removeItem(PENDING_INTENT_KEY);
          try {
            dispatchIntent(JSON.parse(raw) as PendingIntent);
          } catch {
            /* 손상된 값은 무시 */
          }
        }
      }
    })();

    // 어떤 API 호출이든 재발급이 끝내 실패하면(리프레시 만료/무효):
    // 로그인 상태를 내리고, 현재 페이지에 머문 채 "로그인 필요" 안내와 함께 로그인 모달로 유도한다.
    // (캐시는 비우지 않는다 — clear() 하면 활성 쿼리가 즉시 재요청→401→만료 통지로 루프가 돈다.
    //  동일 사용자의 세션 만료라 교차 사용자 누수도 없으므로 비울 이유가 없다. 캐시 비우기는 명시적 로그아웃에서만.)
    const unsubscribe = onSessionExpired(() => {
      if (!alive) return;
      setLoggedIn(false);
      openLogin('로그인이 필요한 서비스예요. 로그인 후 다시 이용해 주세요.');
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  // 게스트 취소는 백엔드 연결 전이라 클라이언트에서 취소된 예약 id를 보관
  const [canceledIds, setCanceledIds] = useState<Set<number>>(new Set());
  const cancelReservation = (id: number) =>
    setCanceledIds(prev => new Set(prev).add(id));

  return (
    <AppStateContext.Provider
      value={{ search, setSearch, selectedListing, setSelectedListing, isLoggedIn, setLoggedIn, loginOpen, loginNotice, openLogin, closeLogin, runAfterLogin, persistIntentForOAuth, pendingSaveHeart, clearPendingSaveHeart, canceledIds, cancelReservation }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
