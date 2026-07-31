import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Heart, Home, LogOut, Map, Menu, ShieldCheck, UserRound } from 'lucide-react';
import {
  useCurrentUserQuery,
  useHostActivationMutation,
  useLogoutMutation,
} from '../../features/auth/api/authQueries';
import { canAccessAdmin, canAccessHost, getRoleLabel } from '../../features/auth/lib/authAccess';
import { NotificationBell } from '../../features/notifications/ui/NotificationBell';
import { useNotificationStream } from '../../features/notifications/api/notificationStream';

// 라우트(Outlet 자식)로 내려주는 레이아웃 컨텍스트. 지도 페이지가 헤더 검색 슬롯에 포털할 때 사용한다.
export type AppLayoutContext = {
  headerSearchSlot: HTMLElement | null;
};

export function AppLayout() {
  const { data: user } = useCurrentUserQuery();
  // 로그인 상태에서만 SSE 연결을 유지한다(로그아웃 시 자동 해제).
  useNotificationStream(Boolean(user));
  const logoutMutation = useLogoutMutation();
  const hostActivationMutation = useHostActivationMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  // 지도 페이지에서 검색바를 헤더 중앙에 끼워 넣기 위한 포털 대상. MapSearchPage 가 이 슬롯으로 검색바를 렌더한다.
  const [headerSearchSlot, setHeaderSearchSlot] = useState<HTMLDivElement | null>(null);
  const hasHostAccess = user ? canAccessHost(user.role) : false;
  const hasAdminAccess = user ? canAccessAdmin(user.role) : false;
  // 지도 검색 페이지는 지도/숙소만 전체 화면으로 보여주므로 하단 푸터를 숨긴다.
  const isMapPage = location.pathname === '/rooms/map';
  const accountMenuRef = useRef<HTMLDivElement>(null);

  function closeAccountMenu() {
    setIsAccountMenuOpen(false);
  }

  // 계정 메뉴가 열려 있을 때, 메뉴 바깥(다른 네비 링크 등)을 누르면 닫는다. 메뉴를 연 채로
  // 다른 페이지로 이동해도 계속 열려 있는 문제를 막는다(링크 클릭=바깥 pointerdown → 닫힘).
  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  function handleStartHosting() {
    // 비로그인: 로그인 페이지로 이동 (로그인 후 원래 위치로 복귀)
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // GUEST: 호스트로 승격 후 호스트 관리 페이지로 이동.
    // 성공 시 캐시의 user.role이 HOST로 바뀌어 헤더에 호스트 메뉴가 노출됩니다.
    hostActivationMutation.mutate(undefined, {
      onSuccess: () => navigate('/host/rooms'),
    });
  }

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        closeAccountMenu();
        navigate('/', { replace: true });
      },
    });
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="AirDnD 홈">
          <span className="brand-mark">A</span>
          AirDnD
        </Link>
        {isMapPage ? (
          // 지도 페이지: 내비게이션 자리에 검색바 슬롯을 둔다(검색바는 MapSearchPage 가 포털로 채움).
          <div className="header-search" ref={setHeaderSearchSlot} />
        ) : (
          <nav className="site-nav" aria-label="주요 메뉴">
            <NavLink to="/" end>
              <Home size={16} />
              숙소
            </NavLink>
            <NavLink to="/rooms/map">
              <Map size={16} />
              지도
            </NavLink>
            {user ? <NavLink to="/reservations">예약</NavLink> : null}
            {user ? (
              <NavLink to="/wishlists">
                <Heart size={16} />
                위시리스트
              </NavLink>
            ) : null}
            {hasHostAccess ? <NavLink to="/host/rooms">호스트</NavLink> : null}
            {hasAdminAccess ? (
              <NavLink to="/admin">
                <ShieldCheck size={16} />
                관리자
              </NavLink>
            ) : null}
          </nav>
        )}
        <div className="header-actions">
          {/* 지도 페이지에서는 우측을 알림 + 계정 버튼만 남기므로 호스팅 CTA 를 숨긴다. */}
          {!isMapPage && !hasHostAccess ? (
            <button
              className="host-cta"
              type="button"
              onClick={handleStartHosting}
              disabled={hostActivationMutation.isPending}
            >
              {hostActivationMutation.isPending ? '전환 중...' : '호스팅 시작하기'}
            </button>
          ) : null}
          {user ? <NotificationBell /> : null}
          <div className={`account-menu ${isAccountMenuOpen ? 'open' : ''}`} ref={accountMenuRef}>
            <button
              className="account-menu-trigger"
              type="button"
              aria-expanded={isAccountMenuOpen}
              aria-label={user ? `${user.name} 계정 메뉴` : '계정 메뉴'}
              onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
            >
              <Menu size={16} />
              {user?.avatarUrl ? (
                <img className="account-avatar" src={user.avatarUrl} alt="" />
              ) : (
                <UserRound size={18} />
              )}
              {user ? <span className="sr-only">{user.name}</span> : null}
            </button>
            {isAccountMenuOpen ? (
              <div className="account-menu-panel">
                {user ? (
                  <>
                    <div className="account-menu-summary">
                      <strong>{user.name}</strong>
                      <span>{getRoleLabel(user.role)}</span>
                    </div>
                    <Link to="/my" onClick={closeAccountMenu}>
                      <UserRound size={16} />
                      마이페이지
                    </Link>
                    <Link to="/reservations" onClick={closeAccountMenu}>
                      예약
                    </Link>
                    <Link to="/wishlists" onClick={closeAccountMenu}>
                      <Heart size={16} />
                      위시리스트
                    </Link>
                    <Link to="/notifications" onClick={closeAccountMenu}>
                      <Bell size={16} />
                      알림
                    </Link>
                    {hasHostAccess ? (
                      <Link to="/host/rooms" onClick={closeAccountMenu}>
                        호스트 관리
                      </Link>
                    ) : null}
                    {hasAdminAccess ? (
                      <Link to="/admin" onClick={closeAccountMenu}>
                        <ShieldCheck size={16} />
                        관리자
                      </Link>
                    ) : null}
                    <button type="button" disabled={logoutMutation.isPending} onClick={handleLogout}>
                      <LogOut size={16} />
                      {logoutMutation.isPending ? '로그아웃 중' : '로그아웃'}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeAccountMenu}>
                      로그인
                    </Link>
                    <Link to="/rooms/map" onClick={closeAccountMenu}>
                      지도에서 찾기
                    </Link>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="page-container">
        <Outlet context={{ headerSearchSlot } satisfies AppLayoutContext} />
      </main>
      {isMapPage ? null : (
      <footer className="site-footer">
        <div className="footer-grid">
          <section>
            <h2>소개</h2>
            <ul>
              <li>AirDnD 소개</li>
              <li>뉴스룸</li>
              <li>채용</li>
              <li>투자자 정보</li>
            </ul>
          </section>
          <section>
            <h2>커뮤니티</h2>
            <ul>
              <li>게스트 추천</li>
              <li>다양성과 포용</li>
              <li>지역 파트너</li>
              <li>여행 가이드</li>
            </ul>
          </section>
          <section>
            <h2>호스팅</h2>
            <ul>
              <li>숙소 등록</li>
              <li>호스트 리소스</li>
              <li>호스트 보호 정책</li>
              <li>수익 계산</li>
            </ul>
          </section>
          <section>
            <h2>지원</h2>
            <ul>
              <li>도움말 센터</li>
              <li>예약 취소 옵션</li>
              <li>안전 정보</li>
              <li>문의하기</li>
            </ul>
          </section>
        </div>
        <div className="footer-bottom">
          <span>© 2026 AirDnD</span>
          <span>개인정보 처리방침 · 이용약관 · 사이트맵</span>
        </div>
      </footer>
      )}
    </div>
  );
}
