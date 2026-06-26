import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/Header';
import type { SearchSegment } from '../../components/SearchBar';
import { FilterModal } from '../../components/FilterModal';
import { SaveToWishlistModal } from '../../components/SaveToWishlistModal';
import { removeWishlistItem } from '../../shared/api/wishlist';
import { useAppState } from '../../shared/AppState';
import { getListingsOptions } from '../../shared/api/generated/@tanstack/react-query.gen';
import type { ListingCardResponse, ListingSearchCondition } from '../../shared/api/generated/types.gen';
import type { SearchState } from '../../types';
import type { Bounds } from '../../shared/map';
import { ResultCard } from './ResultCard';
import { ResultsMap } from './ResultsMap';
import { Pagination } from './Pagination';

// SearchState(+지도 영역) → 백엔드 검색 조건. 빈 필터는 보내지 않음
function buildCondition(s: SearchState, bounds: Bounds | null): ListingSearchCondition {
  const condition: ListingSearchCondition = {};
  if (bounds) condition.mapBounds = bounds;
  // 지도 이동 검색(bounds) 중에는 지역 필터 무시 — 지도 영역이 우선
  if (!bounds && s.region?.sidoCode) {
    condition.region = {
      sidoCode: s.region.sidoCode,
      sigunguCode: s.region.sigunguCode ?? undefined,
    };
  }
  if (s.range?.a && s.range?.b) {
    condition.dateRange = { checkIn: s.range.a, checkOut: s.range.b };
  }
  const g = s.guests;
  if (s.guestLabel && g) {
    condition.guestCount = {
      adults: g.adult || undefined,
      children: g.child || undefined,
      infants: g.infant || undefined,
      pets: g.pet || undefined,
    };
  }
  if (s.priceMin != null || s.priceMax != null) {
    condition.priceRange = {
      minPrice: s.priceMin ?? undefined,
      maxPrice: s.priceMax ?? undefined,
    };
  }
  return condition;
}

export function Results() {
  const navigate = useNavigate();
  const { search, setSearch } = useAppState();
  // 검색 버튼 누른 시점의 조건 스냅샷(편집 중 즉시 재조회 방지)
  const [appliedSearch, setAppliedSearch] = useState<SearchState>(search);
  // 상단 검색 pill 클릭 시 헤더에서 인라인 확장 + 눌린 구역 패널 열기
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchSeg, setSearchSeg] = useState<SearchSegment>('dest');
  // 필터 모달
  const [filterOpen, setFilterOpen] = useState(false);
  // 검색 시 지도를 결과로 이동시키는 신호
  const [focusSignal, setFocusSignal] = useState(0);
  // listingId 기준 좋아요 오버라이드(서버 isWishlisted 위에 세션 변경분)
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  // listingId → wishlistId (unlike 시 DELETE 대상)
  const [savedAt, setSavedAt] = useState<Record<number, number>>({});
  // 저장 모달 대상 listingId (null이면 닫힘)
  const [saveFor, setSaveFor] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // 카드 ↔ 지도 핀 hover 동기화 대상 listingId
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const [page, setPage] = useState(0);
  // 지도 영역 필터(idle 시 갱신). 지도 이동하면 페이징 초기화 후 해당 영역으로 재검색
  const [mapBounds, setMapBounds] = useState<Bounds | null>(null);
  const condition = buildCondition(appliedSearch, mapBounds);
  const listingsQuery = useQuery(
    getListingsOptions({
      query: { condition, pageRequest: { page, size: 20 } },
    }),
  );
  const pageData = listingsQuery.data?.data;
  const cards = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;
  const totalElements = pageData?.totalElements ?? 0;

  const goPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 지도 영역 변경 → 페이징 초기화 후 해당 영역으로 재검색
  const onBoundsChange = (b: Bounds) => {
    setMapBounds(b);
    setPage(0);
  };

  const isLiked = (c: ListingCardResponse) =>
    c.id != null && liked[c.id] !== undefined ? liked[c.id] : !!c.isWishlisted;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  // 하트 클릭: 저장돼 있으면 DELETE, 아니면 저장 모달 열기
  const onHeart = (c: ListingCardResponse) => {
    const listingId = c.id;
    if (listingId == null) return;
    if (!isLiked(c)) {
      setSaveFor(listingId);
      return;
    }
    const wishlistId = savedAt[listingId];
    if (wishlistId == null) {
      // 서버에서 이미 찜된 항목(이번 세션 외) — wishlistId를 몰라 삭제 불가, 모달로 재처리
      setSaveFor(listingId);
      return;
    }
    setLiked((prev) => ({ ...prev, [listingId]: false }));
    removeWishlistItem(wishlistId, listingId)
      .then(() => {
        setSavedAt((prev) => {
          const next = { ...prev };
          delete next[listingId];
          return next;
        });
        showToast('위시리스트에서 삭제했어요');
      })
      .catch(() => {
        setLiked((prev) => ({ ...prev, [listingId]: true }));
        showToast('삭제에 실패했어요');
      });
  };

  const onOpen = (c: ListingCardResponse) => {
    if (c.id != null) navigate(`/listings/${c.id}`);
  };
  const onSearchPill = (seg: SearchSegment) => {
    setSearchSeg(seg);
    setSearchExpanded(true);
  };

  return (
    <div>
      <Header
        mode="compact"
        search={search}
        onSearchPill={onSearchPill}
        onFilter={() => setFilterOpen(true)}
        searchExpanded={searchExpanded}
        searchInitial={searchSeg}
        onSearchChange={setSearch}
        onSearchSubmit={() => {
          setAppliedSearch(search);
          // 새 검색은 지역/조건 기준 — 이전 지도 영역 필터 해제 후 지도를 결과로 이동
          setMapBounds(null);
          setPage(0);
          setFocusSignal(n => n + 1);
          setSearchExpanded(false);
        }}
        onSearchClose={() => setSearchExpanded(false)}
      />
      <div style={{ display: 'flex' }}>
        {/* Listing list (페이지 전체가 스크롤 — 스크롤바는 화면 맨 우측) */}
        <div
          style={{
            flex: '0 0 60%',
            padding: '28px 48px 60px 48px',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 6 }}>
            {totalElements.toLocaleString('ko-KR')}개의 숙소 · {search.dates || '날짜 미정'} · {search.guestLabel || '게스트 추가'}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 28,
              marginBottom: 22,
            }}
          >
            지도에서 선택한 지역의 숙소
          </h1>

          {listingsQuery.isLoading ? (
            <div style={{ color: 'var(--ink-3)' }}>불러오는 중…</div>
          ) : cards.length === 0 ? (
            <div style={{ color: 'var(--ink-3)' }}>조건에 맞는 숙소가 없어요.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
              {cards.map((c, i) => (
                <ResultCard
                  key={c.id ?? i}
                  card={c}
                  liked={isLiked(c)}
                  onOpen={() => onOpen(c)}
                  onHeart={() => onHeart(c)}
                  onHover={hovering => setHoveredId(hovering ? c.id ?? null : null)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={goPage} />
          )}
        </div>

        {/* Map */}
        <div
          style={{
            flex: 1,
            position: 'sticky',
            top: 104,
            height: 'calc(100vh - 80px - 48px)',
            margin: '24px 48px 24px 0',
            background: '#E8EDF0',
            overflow: 'hidden',
            borderRadius: 18,
            boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
          }}
        >
          <ResultsMap
            cards={cards}
            onOpen={onOpen}
            hoveredId={hoveredId}
            likedIds={new Set(cards.filter(c => c.id != null && isLiked(c)).map(c => c.id!))}
            onBoundsChange={onBoundsChange}
            focusSignal={focusSignal}
          />
        </div>
      </div>

      <FilterModal
        open={filterOpen}
        value={search}
        onChange={setSearch}
        onClose={() => setFilterOpen(false)}
        onApply={() => {
          setAppliedSearch(search);
          setPage(0);
          setFilterOpen(false);
        }}
        onReset={() => setSearch({ ...search, priceMin: null, priceMax: null })}
        resultCount={totalElements}
      />

      <SaveToWishlistModal
        open={saveFor !== null}
        listingId={saveFor}
        onClose={() => setSaveFor(null)}
        onSaved={(wishlistName, wishlistId) => {
          if (saveFor !== null) {
            setLiked((prev) => ({ ...prev, [saveFor]: true }));
            setSavedAt((prev) => ({ ...prev, [saveFor]: wishlistId }));
          }
          setSaveFor(null);
          showToast(`'${wishlistName}'에 저장했어요`);
        }}
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
