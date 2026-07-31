import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { AppLayoutContext } from '../../app/router/AppLayout';
import { useRoomListQuery } from '../../features/rooms/api/roomsQueries';
import { SearchBar } from '../../features/rooms/ui/SearchBar';
import { RoomReviewBadge } from '../../features/reviews/ui/RoomReviewBadge';
import { AddToWishlistButton } from '../../features/wishlist/ui/AddToWishlistButton';
import { RoomResultsMap } from '../../features/maps/ui/RoomResultsMap';
import { MapBounds } from '../../features/maps/model/locationTypes';
import { RoomSearchParams } from '../../features/rooms/model/roomTypes';
import { formatCurrency } from '../../shared/lib/format';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';
import { InfiniteScrollSentinel } from '../../shared/ui/InfiniteScrollSentinel';

// 한 페이지(커서) 크기. 목록은 스크롤로 페이지를 이어 붙입니다.
const PAGE_SIZE = 18;
// 지도에 한 번에 찍는 핀 상한. 스크롤로 페이지를 더 불러와도 핀이 지도를 뒤덮지 않도록 제한합니다.
const MAP_PIN_CAP = 200;

interface GeocoderViewportPoint {
  lat: () => number;
  lng: () => number;
}

interface GeocoderResult {
  geometry: {
    viewport: {
      getNorthEast: () => GeocoderViewportPoint;
      getSouthWest: () => GeocoderViewportPoint;
    };
  };
}

export function MapSearchPage() {
  const { headerSearchSlot } = useOutletContext<AppLayoutContext>();
  // 데스크톱(2단 레이아웃)에서만 검색바를 헤더로 올린다. 모바일에서는 헤더가 세로로 접히므로 본문에 둔다.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(min-width: 981px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 981px)');
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<number>>(new Set());
  // 현재 지도 영역. 지도가 멈출 때마다(자동 검색) 갱신되고, 이 영역으로 결과를 조회합니다.
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  // 지오코딩 결과 영역. 지역 검색 시 카메라를 그곳으로 한 번 이동시킵니다.
  const [fitTarget, setFitTarget] = useState<MapBounds | null>(null);
  // 지오코딩 대기 중인 지역명(지도 라이브러리가 준비되면 처리). 최초 진입 시 URL 의 region 으로 시작합니다.
  const [pendingRegion, setPendingRegion] = useState<string | null>(() => searchParams.get('region') || null);

  const region = searchParams.get('region') ?? '';

  // 지역(region)은 지도 위치를 정하는 데만 쓰고(지오코딩), DB 필터로는 보내지 않습니다.
  // 결과는 "현재 보이는 영역(bbox) 안의 숙소"이며, 지역 텍스트 일치 여부와 무관합니다.
  const filterParams: RoomSearchParams = {
    checkIn: searchParams.get('checkIn') ?? '',
    checkOut: searchParams.get('checkOut') ?? '',
    guests: Number(searchParams.get('guests') ?? '1'),
    adults: Number(searchParams.get('adults') ?? searchParams.get('guests') ?? '1'),
    children: Number(searchParams.get('children') ?? '0'),
    infants: Number(searchParams.get('infants') ?? '0'),
    minPrice: Number(searchParams.get('minPrice') ?? '0') || undefined,
    maxPrice: Number(searchParams.get('maxPrice') ?? '0') || undefined,
    allowsPets: searchParams.get('allowsPets') === 'true' || undefined,
  };

  // SearchBar 초기값에는 region 도 채워줍니다(입력칸 표시·지오코딩용).
  const searchBarDefault: RoomSearchParams = { region, ...filterParams };

  const areaParams: RoomSearchParams = bounds
    ? {
        ...filterParams,
        south: bounds.south,
        west: bounds.west,
        north: bounds.north,
        east: bounds.east,
        size: PAGE_SIZE,
      }
    : filterParams;

  const areaQuery = useRoomListQuery(areaParams, bounds != null);
  // 무한 스크롤로 불러온 모든 페이지를 이어 붙입니다(뷰포트가 바뀌면 키가 달라져 1페이지부터 다시 시작).
  const rooms = useMemo(
    () => areaQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [areaQuery.data],
  );
  // totalCount 는 첫 페이지에서만 내려옵니다("이 지역에 N곳").
  const totalCount = areaQuery.data?.pages[0]?.totalCount ?? null;
  // 지도 핀은 상한까지만. 목록은 전부 보여주되 핀만 잘라 지도를 보호합니다.
  const mappedRooms = useMemo(() => rooms.slice(0, MAP_PIN_CAP), [rooms]);
  const pinsCapped = rooms.length > MAP_PIN_CAP;

  // 지역명 → 좌표/영역(지오코딩). 지도 라이브러리가 준비되면 대기 중인 지역을 처리합니다.
  const geocodingLib = useMapsLibrary('geocoding');
  const geocoder = useMemo(() => (geocodingLib ? new geocodingLib.Geocoder() : null), [geocodingLib]);
  useEffect(() => {
    if (!pendingRegion || !geocoder) {
      return;
    }
    let cancelled = false;
    geocoder
      .geocode({ address: pendingRegion, region: 'KR' })
      .then(({ results }: { results: GeocoderResult[] }) => {
        if (cancelled || results.length === 0) return;
        const vp = results[0].geometry.viewport;
        const ne = vp.getNorthEast();
        const sw = vp.getSouthWest();
        // 카메라를 이 영역으로 이동 → 지도가 멈추면 자동 검색이 그 영역을 조회합니다.
        setFitTarget({ north: ne.lat(), east: ne.lng(), south: sw.lat(), west: sw.lng() });
      })
      .catch(() => {
        /* 지오코딩 실패 시 지도를 그대로 둡니다(목록은 정상 동작). */
      })
      .finally(() => {
        if (!cancelled) setPendingRegion(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pendingRegion, geocoder]);

  function handleSearch(nextParams: RoomSearchParams) {
    const nextRegion = nextParams.region ?? '';
    // 지역이 새로 지정/변경되면 지도를 그 지역으로 이동시킵니다(지오코딩). 그 외 필터만 바뀌면
    // 현재 영역을 유지하고, 파라미터가 바뀌므로 같은 영역으로 결과가 자동 갱신됩니다.
    if (nextRegion && nextRegion !== region) {
      setPendingRegion(nextRegion);
    }
    const next = new URLSearchParams();
    Object.entries(nextParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        next.set(key, String(value));
      }
    });
    setSearchParams(next);
  }

  function handleSelect(roomId: number | null) {
    setSelectedId(roomId);
    if (roomId != null) {
      setViewedIds((prev) => new Set(prev).add(roomId));
    }
  }

  return (
    <section className="stack map-search-page">
      {/* 데스크톱: 검색바를 헤더 중앙 슬롯으로 포털(세로 공간 절약). 모바일: 본문 상단에 일반 검색바.
          지오코딩 등 검색 로직은 어느 쪽이든 이 페이지가 그대로 소유한다. */}
      {isDesktop && headerSearchSlot ? (
        createPortal(
          <SearchBar defaultValue={searchBarDefault} onSearch={handleSearch} compact />,
          headerSearchSlot,
        )
      ) : (
        <SearchBar defaultValue={searchBarDefault} onSearch={handleSearch} />
      )}
      <div className="map-layout">
        <div className="list-stack">
          {bounds && totalCount != null ? (
            <p className="map-results-count">
              이 지역에 <strong>{totalCount.toLocaleString()}{totalCount >= 1000 ? '+' : ''}</strong>곳
              {pinsCapped ? ` · 지도에는 ${MAP_PIN_CAP}곳까지만 표시됩니다. 더 좁혀보세요` : ''}
            </p>
          ) : null}
          {areaQuery.isLoading ? <Loading message="지도 검색 결과를 불러오는 중입니다." /> : null}
          {areaQuery.error ? <ErrorMessage error={areaQuery.error} /> : null}
          <div className="map-result-grid">
            {rooms.map((room) => (
              <article
                className="map-result-card-wrap"
                key={room.id}
                onMouseEnter={() => setHoveredId(room.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* 메인 화면 카드와 동일한 위시리스트 하트(사진 우상단). Link 바깥의 형제로 둬 앵커 중첩을 피한다. */}
                <AddToWishlistButton roomId={room.id} className="room-card-save" />
                <Link
                  className={`map-result-card ${
                    selectedId === room.id || hoveredId === room.id ? 'is-active' : ''
                  }`}
                  to={`/rooms/${room.id}`}
                >
                  <div className="map-result-card-media">
                    <img src={room.imageUrl} alt={`${room.name} 대표 이미지`} />
                  </div>
                  <div className="map-result-card-body">
                    <div className="room-card-title-row">
                      <h2>{room.name}</h2>
                      <RoomReviewBadge rating={room.rating} reviewCount={room.reviewCount} showReviewCount={false} />
                    </div>
                    <p className="room-card-location muted">{room.address}</p>
                    <p className="room-price">
                      <strong>{formatCurrency(room.pricePerNight)}</strong>
                      <span>/ 박</span>
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
          {areaQuery.data && rooms.length === 0 ? (
            <p className="map-results-empty">현재 지도 영역에 검색 결과가 없습니다.</p>
          ) : null}
          {areaQuery.data ? (
            <InfiniteScrollSentinel
              onReachEnd={() => areaQuery.fetchNextPage()}
              hasNext={areaQuery.hasNextPage}
              isFetching={areaQuery.isFetchingNextPage}
            />
          ) : null}
        </div>
        <RoomResultsMap
          rooms={mappedRooms}
          selectedId={selectedId}
          hoveredId={hoveredId}
          viewedIds={viewedIds}
          onSelect={handleSelect}
          onHover={setHoveredId}
          onSearchArea={setBounds}
          fitBoundsTarget={fitTarget}
          onFitConsumed={() => setFitTarget(null)}
          suppressInitialSearch={pendingRegion != null}
        />
      </div>
    </section>
  );
}
