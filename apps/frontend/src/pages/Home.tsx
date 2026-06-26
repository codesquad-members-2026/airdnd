import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { SearchBar, type SearchSegment } from '../components/SearchBar';
import { SaveToWishlistModal } from '../components/SaveToWishlistModal';
import { useAppState } from '../shared/AppState';
import { MAJOR_CITIES, regionLabel, type RegionOption } from '../shared/regions';
import { RegionRow } from './home/RegionRow';
import { useHomeWishlist } from './home/useHomeWishlist';

const FOOTER_COLS: [string, string[]][] = [
  ['소개', ['이용 방법', '뉴스룸', '투자자 정보', '호텔투나잇', '비즈니스 프로그램', '채용정보']],
  ['커뮤니티', ['다양성 및 소속감', '접근성', '어소시에이트', '구호 인력을 위한 숙소', '게스트 추천']],
  ['호스팅하기', ['숙소 호스팅', '온라인 체험 호스팅하기', '체험 호스팅하기', '책임감 있는 호스팅', '호스트 추천', '자료 센터']],
  ['지원', ['코로나19 대응 방안', '도움말 센터', '예약 취소 옵션', '이웃 민원 지원', '신뢰와 안전']],
];

export function Home() {
  const navigate = useNavigate();
  const { search, setSearch } = useAppState();
  const { isLiked, onHeart, saveFor, setSaveFor, onSaved, toast } = useHomeWishlist();

  // 히어로 검색바가 상단을 지나면 compact 헤더(상단 pill)로 전환
  const [scrolled, setScrolled] = useState(false);
  // compact pill 클릭 시 헤더에서 검색바 인라인 확장
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchSeg, setSearchSeg] = useState<SearchSegment>('dest');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onSearch = () => navigate('/results');

  // 지역 헤더/전체보기 클릭 → 해당 지역 조건으로 검색 페이지 이동
  const onSeeAll = (r: RegionOption) => {
    setSearch({
      ...search,
      region: { sidoCode: r.sidoCode, sigunguCode: r.sigunguCode },
      destination: regionLabel(r.sidoCode, r.sigunguCode),
    });
    navigate('/results');
  };

  return (
    <div>
      {/* Hero — 흰 배경 + 검색바 밑 구분선 */}
      <div
        style={{
          position: 'relative',
          height: 210,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Header
          mode={scrolled ? 'compact' : 'full'}
          overlay
          search={search}
          searchExpanded={searchExpanded}
          searchInitial={searchSeg}
          onSearchPill={(seg) => {
            setSearchSeg(seg);
            setSearchExpanded(true);
          }}
          onSearchChange={setSearch}
          onSearchSubmit={() => {
            setSearchExpanded(false);
            navigate('/results');
          }}
          onSearchClose={() => setSearchExpanded(false)}
        />
        <div
          style={{
            position: 'absolute',
            top: 120,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            // 스크롤 시 히어로 검색바는 페이드아웃(상단 pill로 대체)
            opacity: scrolled ? 0 : 1,
            transform: scrolled ? 'translateY(-12px)' : 'none',
            transition: 'opacity 200ms ease, transform 200ms ease',
            pointerEvents: scrolled ? 'none' : 'auto',
          }}
        >
          <SearchBar value={search} onChange={setSearch} onSearch={onSearch} />
        </div>
      </div>

      {/* 주요 지역별 인기 숙소 — 가로 스와이프 */}
      {MAJOR_CITIES.map((region) => (
        <RegionRow
          key={`${region.sidoCode}-${region.sigunguCode ?? ''}`}
          region={region}
          onOpenListing={(id) => navigate(`/listings/${id}`)}
          onSeeAll={onSeeAll}
          isLiked={isLiked}
          onHeart={onHeart}
        />
      ))}

      <Footer />

      <SaveToWishlistModal
        open={saveFor !== null}
        listingId={saveFor}
        onClose={() => setSaveFor(null)}
        onSaved={onSaved}
      />

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--cta-dark)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: 'var(--shadow-pop)',
            zIndex: 300,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer
      style={{
        marginTop: 80,
        background: 'var(--surface-footer)',
        padding: '64px 80px 40px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
          paddingBottom: 40,
          borderBottom: '1px solid var(--line)',
        }}
      >
        {FOOTER_COLS.map(([heading, items]) => (
          <div key={heading}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>{heading}</div>
            {items.map((item) => (
              <div
                key={item}
                className="foot-link"
                style={{
                  fontSize: 14,
                  color: 'var(--ink-2)',
                  padding: '7px 0',
                  cursor: 'pointer',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 28,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          fontSize: 13,
          color: 'var(--ink-3)',
          alignItems: 'center',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink-1)' }}>
          air<span style={{ color: 'var(--brand-coral)' }}>dnd</span>
        </span>
        <span>© 2021 airdnd, Inc.</span>
        <span>· 개인정보처리방침 · 이용약관 · 회사 세부정보</span>
      </div>
    </footer>
  );
}
