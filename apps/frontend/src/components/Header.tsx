import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import { LoginModal } from './LoginModal';
import { useAppState } from '../shared/AppState';
import { useToast } from '../shared/Toast';
import { API_BASE } from '../shared/api/config';
import { SearchBar, type SearchSegment } from './SearchBar';
import logoSvg from '../assets/logo.svg';
import type { SearchState } from '../types';

interface HeaderProps {
  mode?: 'full' | 'compact' | 'minimal';
  search?: SearchState;
  // pill의 어느 구역을 눌렀는지 전달(해당 패널 열기)
  onSearchPill?: (seg: SearchSegment) => void;
  // 검색바 옆 필터 버튼
  onFilter?: () => void;
  // compact 전용: pill이 검색바로 인라인 확장된 상태
  searchExpanded?: boolean;
  // 확장 시 바로 열어둘 세그먼트
  searchInitial?: SearchSegment;
  onSearchChange?: (s: SearchState) => void;
  onSearchSubmit?: () => void;
  onSearchClose?: () => void;
}

export function Header({
  mode = 'full',
  search,
  onSearchPill,
  onFilter,
  searchExpanded = false,
  searchInitial,
  onSearchChange,
  onSearchSubmit,
  onSearchClose,
}: HeaderProps) {
  const navigate = useNavigate();
  const { isLoggedIn, setLoggedIn } = useAppState();
  const toast = useToast();
  const onLogo = () => navigate('/');
  const onHosting = () => navigate('/host');
  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };
  const onLogout = async () => {
    setMenuOpen(false);
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      /* 네트워크 실패해도 클라이언트 상태는 비운다 */
    }
    setLoggedIn(false);
    toast.show("로그아웃되었어요");
    navigate('/');
  };
  const compact = mode === 'compact';
  const solid = compact || mode === 'minimal';
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 검색바 인라인 확장: 닫힐 때 collapse 애니메이션 후 언마운트
  const [showSearch, setShowSearch] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (searchExpanded) {
      setShowSearch(true);
      setClosing(false);
    } else {
      setClosing((prev) => (showSearch ? true : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchExpanded]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // showSearch: 검색바 렌더 여부(닫힘 애니메이션 동안 유지). expanded: 레이아웃 확장 상태
  const expanded = compact && showSearch;

  return (
    <>
      {/* 확장 시 뒤 콘텐츠를 살짝 어둡게 — 검색바 강조. 바깥 클릭 시 접힘 */}
      {expanded && (
        <div
          className={closing ? 'search-dim-exit' : 'search-dim-enter'}
          onMouseDown={onSearchClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 30,
            background: 'rgba(0,0,0,0.18)',
          }}
        />
      )}
      {/* 흰색 헤더 패널 — 검색바 높이만큼 아래로 확장(오버레이, 콘텐츠 안 밀림) */}
      {expanded && (
        <div
          className={closing ? 'header-panel-collapse' : 'header-panel-expand'}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 35,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--line)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
          }}
        />
      )}
      {/* 검색바 오버레이 — flow 밖(fixed)이라 아래 콘텐츠를 밀지 않음 */}
      {expanded && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: 0,
            right: 0,
            zIndex: 45,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            className={closing ? 'searchbar-collapse' : 'searchbar-expand'}
            style={{ pointerEvents: 'auto' }}
            onAnimationEnd={(e) => {
              // 자식(팝오버) 애니메이션 버블 무시 — wrapper 자신만 처리
              if (e.target !== e.currentTarget) return;
              if (closing) {
                setShowSearch(false);
                setClosing(false);
              }
            }}
          >
            <SearchBar
              value={search!}
              onChange={onSearchChange!}
              onSearch={onSearchSubmit!}
              fluid
              initialActive={searchInitial}
            />
          </div>
        </div>
      )}
      <header
        style={{
          position: solid ? 'sticky' : 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          height: solid ? 80 : 94,
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          background: solid ? 'var(--surface)' : 'transparent',
          borderBottom: solid && !expanded ? '1px solid var(--line)' : 'none',
        }}
      >
      {/* Left: wordmark */}
      <div style={{ flex: 1 }}>
        <img
          src={logoSvg}
          alt="airdnd"
          onClick={onLogo}
          style={{ height: 44, cursor: 'pointer', display: 'block' }}
        />
      </div>

      {/* Center: search pill (compact) / nav (full) / 없음 (minimal). 펼침 시 pill 숨김(검색바는 오버레이) */}
      {compact && expanded ? (
        <div style={{ flex: 'none' }} />
      ) : compact ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            height: 48,
            padding: '0 8px 0 8px',
            borderRadius: 60,
            flexShrink: 0,
            border: '1px solid var(--line-strong)',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            background: '#fff',
          }}
        >
          <PillSection seg="dest" onClick={onSearchPill}>
            <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', color: search?.destination ? 'var(--ink-1)' : 'var(--ink-3)' }}>
              {search?.destination || '지역 검색'}
            </span>
          </PillSection>
          <PillDivider />
          <PillSection seg="date" onClick={onSearchPill}>
            <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', color: search?.dates ? 'var(--ink-1)' : 'var(--ink-3)' }}>
              {search?.dates || '날짜 입력'}
            </span>
          </PillSection>
          <PillDivider />
          <PillSection seg="guest" onClick={onSearchPill}>
            <span style={{ fontSize: 14, color: search?.guestLabel ? 'var(--ink-1)' : 'var(--ink-3)', whiteSpace: 'nowrap' }}>
              {search?.guestLabel || '인원 추가'}
            </span>
          </PillSection>
          <span
            onClick={() => onSearchPill?.('dest')}
            style={{
              marginLeft: 14,
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--brand-coral)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="search" size={16} color="#fff" />
          </span>
        </div>
        {/* 필터 버튼 */}
        <button
          onClick={onFilter}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 40,
            padding: '0 14px',
            borderRadius: 60,
            flexShrink: 0,
            border: '1px solid var(--line-strong)',
            background: '#fff',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink-1)',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
        >
          <Icon name="sliders" size={15} color="var(--ink-1)" />
          필터
        </button>
        </div>
      ) : mode === 'full' ? (
        <nav
          style={{
            display: 'flex',
            gap: 60,
            fontSize: 16,
            color: 'var(--ink-1)',
            fontWeight: 500,
          }}
        >
          <a className="gnb-link">숙소</a>
          <a className="gnb-link">체험</a>
          <a className="gnb-link">온라인 체험</a>
        </nav>
      ) : null}

      {/* Right: hosting button + account pill */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onHosting}
          style={{
            height: 40,
            padding: '0 16px',
            border: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--ink-1)',
            cursor: 'pointer',
            borderRadius: 8,
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          호스팅 하기
        </button>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setMenuOpen(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '4px 4px 4px 16px',
              borderRadius: 60,
              border: '1px solid var(--line-strong)',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <Icon name="menu" size={16} color="var(--ink-1)" />
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'var(--ink-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="user" size={16} color="#fff" />
            </span>
          </div>

          {menuOpen && (
            <div
              className="popover-enter"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 264,
                background: '#fff',
                borderRadius: 14,
                boxShadow: 'var(--shadow-pop)',
                border: '1px solid var(--line)',
                overflow: 'hidden',
                zIndex: 60,
                padding: '8px 0',
              }}
            >
              <MenuItem icon="heart" onClick={() => go('/wishlists')}>위시리스트</MenuItem>
              <MenuItem icon="briefcase" onClick={() => go('/trips')}>여행</MenuItem>
              <MenuItem icon="message-circle" badge={2} onClick={() => go('/mypage')}>메시지</MenuItem>
              <MenuItem icon="user" onClick={() => go('/mypage')}>프로필</MenuItem>

              <Divider />

              <MenuItem icon="bell" badge={1} onClick={() => go('/mypage')}>알림</MenuItem>
              <MenuItem icon="settings" onClick={() => go('/mypage')}>계정 설정</MenuItem>
              <MenuItem icon="help-circle" onClick={() => go('/mypage')}>도움말 센터</MenuItem>

              <Divider />

              <MenuItem icon="building-2" onClick={() => go('/host')}>호스팅 하기</MenuItem>
              <MenuItem icon="layout-dashboard" onClick={() => go('/admin')}>관리자 페이지</MenuItem>

              <Divider />

              {isLoggedIn ? (
                <MenuItem icon="log-out" onClick={onLogout}>로그아웃</MenuItem>
              ) : (
                <MenuItem icon="user" onClick={() => { setMenuOpen(false); setLoginOpen(true); }}>
                  로그인
                </MenuItem>
              )}
            </div>
          )}
        </div>
      </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--line)', margin: '8px 0' }} />;
}

function MenuItem({
  onClick,
  disabled,
  icon,
  badge,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon?: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        padding: '11px 18px',
        fontSize: 14,
        fontWeight: 500,
        color: disabled ? 'var(--ink-4)' : 'var(--ink-1)',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'background 100ms ease',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--surface-alt-2)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {icon && <Icon name={icon} size={18} color="var(--ink-2)" />}
      <span style={{ flex: 1 }}>{children}</span>
      {badge != null && (
        <span
          style={{
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 9,
            background: 'var(--brand-coral)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function PillSection({
  seg,
  onClick,
  children,
}: {
  seg: SearchSegment;
  onClick?: (seg: SearchSegment) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={() => onClick?.(seg)}
      style={{
        padding: '0 12px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 60,
        transition: 'background 120ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </div>
  );
}

function PillDivider() {
  return (
    <span
      style={{
        width: 1,
        height: 22,
        background: 'var(--line)',
        margin: '0 16px',
        flexShrink: 0,
      }}
    />
  );
}
