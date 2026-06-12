import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Heart, Home, LogOut, Map, Menu, ShieldCheck, UserRound } from 'lucide-react';
import {
  useCurrentUserQuery,
  useHostActivationMutation,
  useLogoutMutation,
} from '../../features/auth/api/authQueries';
import { canAccessAdmin, canAccessHost, getRoleLabel } from '../../features/auth/lib/authAccess';

export function AppLayout() {
  const { data: user } = useCurrentUserQuery();
  const logoutMutation = useLogoutMutation();
  const hostActivationMutation = useHostActivationMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const hasHostAccess = user ? canAccessHost(user.role) : false;
  const hasAdminAccess = user ? canAccessAdmin(user.role) : false;

  function closeAccountMenu() {
    setIsAccountMenuOpen(false);
  }

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
        <div className="header-actions">
          {!hasHostAccess ? (
            <button
              className="host-cta"
              type="button"
              onClick={handleStartHosting}
              disabled={hostActivationMutation.isPending}
            >
              {hostActivationMutation.isPending ? '전환 중...' : '호스팅 시작하기'}
            </button>
          ) : null}
          <div className={`account-menu ${isAccountMenuOpen ? 'open' : ''}`}>
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
        <Outlet />
      </main>
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
    </div>
  );
}
