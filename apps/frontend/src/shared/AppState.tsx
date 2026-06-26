import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { LISTINGS } from './demoListings';
import { API_BASE } from './api/config';
import { refreshAccessToken, onSessionExpired } from './api/refresh';
import type { SearchState, Listing } from '../types';

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
  canceledIds: Set<number>;
  cancelReservation: (id: number) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState<SearchState>(DEFAULT_SEARCH);
  const [selectedListing, setSelectedListing] = useState<Listing>(LISTINGS[0]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => localStorage.getItem(LOGIN_FLAG_KEY) === 'true'
  );

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
      if (alive) setLoggedIn(authed);
    })();

    // 어떤 API 호출이든 재발급이 끝내 실패하면(리프레시 만료/무효) 로그인 상태를 내린다.
    const unsubscribe = onSessionExpired(() => {
      if (alive) setLoggedIn(false);
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
      value={{ search, setSearch, selectedListing, setSelectedListing, isLoggedIn, setLoggedIn, canceledIds, cancelReservation }}
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
