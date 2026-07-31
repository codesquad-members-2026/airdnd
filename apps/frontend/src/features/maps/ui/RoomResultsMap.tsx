import { useEffect, useMemo, useRef, useState } from 'react';
import { AdvancedMarker, APILoadingStatus, Map, useApiLoadingStatus, useMap } from '@vis.gl/react-google-maps';
import { Search } from 'lucide-react';
import { DEFAULT_KOREA_CENTER, DEFAULT_KOREA_ZOOM, isMapsConfigured, mapsConfig } from '../config/mapsConfig';
import { MapBounds } from '../model/locationTypes';
import { RoomSummary } from '../../rooms/model/roomTypes';
import { RoomPriceMarker } from './RoomPriceMarker';
import { RoomClusterMarker } from './RoomClusterMarker';
import { RoomMapInfoCard } from './RoomMapInfoCard';

interface RoomResultsMapProps {
  // 현재 지도 영역의 검색 결과(목록 카드와 동일한 한 페이지). 이 숙소들이 그대로 지도 핀이 됩니다.
  rooms: RoomSummary[];
  selectedId: number | null;
  hoveredId: number | null;
  viewedIds: Set<number>;
  onSelect: (roomId: number | null) => void;
  onHover: (roomId: number | null) => void;
  // 현재 지도 영역(bbox)으로 검색을 요청합니다. 자동 검색이 켜져 있으면 지도가 멈출 때마다 호출됩니다.
  onSearchArea: (bounds: MapBounds) => void;
  // 설정되면 카메라를 그 경계 상자로 한 번 맞춥니다(지역 검색 결과로 이동). 적용 후 onFitConsumed 로 비웁니다.
  fitBoundsTarget?: MapBounds | null;
  onFitConsumed?: () => void;
  // URL/검색어의 지역 지오코딩을 기다리는 동안 기본 한국 전체 영역으로 첫 검색을 보내지 않습니다.
  suppressInitialSearch?: boolean;
}

type LocatedRoom = RoomSummary & { latitude: number; longitude: number };

interface PointCluster {
  rooms: LocatedRoom[];
  lat: number;
  lng: number;
}

interface PixelPoint {
  x: number;
  y: number;
}

// The d3 tail tip sits 16px from the left edge and 9px below the marker body.
const PRICE_MARKER_ANCHOR: [string, string] = ['16px', 'calc(100% + 9px)'];
// Keep the card arrow above the selected pin so the pin remains visible and clickable.
const INFO_CARD_ANCHOR: [string, string] = ['50%', 'calc(100% + 64px)'];

// 과도하게 줌아웃하지 못하도록 최소 줌을 제한하고, 카메라를 한반도로 묶습니다.
// 해외의 빈 영역으로 패닝하면 백엔드 검색이 공간 인덱스 대신 PK 풀스캔으로 빠져
// 수 초가 걸리므로(한국 전용 서비스), 그 쿼리 자체가 발생하지 않도록 지도를 제한합니다.
const MAP_MIN_ZOOM = 5;
// 제주·울릉도·독도와 주변 해역까지 포함하되 다른 대륙은 제외하는 한반도 경계.
const KOREA_BOUNDS = { north: 39.0, south: 33.0, west: 124.0, east: 132.0 };
const TILE_SIZE = 256;
const CLUSTER_RADIUS_PX = 56;
// 자동 검색을 다시 실행할 최소 이동량. 중심이 현재 뷰포트 가로/세로의 이 비율 이상 움직였을 때만
// 재검색한다(살짝 미는 정도로는 누적된 결과·스크롤이 리셋되지 않도록). 줌 레벨 변경은 항상 재검색.
const SIGNIFICANT_MOVE_RATIO = 0.25;

function hasCoords(room: RoomSummary): room is LocatedRoom {
  return typeof room.latitude === 'number' && typeof room.longitude === 'number';
}

function toWorldPixel(room: LocatedRoom, zoom: number): PixelPoint {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((room.latitude * Math.PI) / 180);
  const clampedSinLat = Math.min(Math.max(sinLat, -0.9999), 0.9999);

  return {
    x: ((room.longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + clampedSinLat) / (1 - clampedSinLat)) / (4 * Math.PI)) * scale,
  };
}

function pixelDistance(a: PixelPoint, b: PixelPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function averagePosition(rooms: LocatedRoom[]) {
  return {
    lat: rooms.reduce((sum, item) => sum + item.latitude, 0) / rooms.length,
    lng: rooms.reduce((sum, item) => sum + item.longitude, 0) / rooms.length,
  };
}

function densestNeighborhood(rooms: LocatedRoom[], zoom: number): LocatedRoom[] {
  if (rooms.length <= 2) {
    return rooms;
  }

  const effectiveZoom = Math.max(zoom, MAP_MIN_ZOOM);
  const pixels = new globalThis.Map<number, PixelPoint>(
    rooms.map((room) => [room.id, toWorldPixel(room, effectiveZoom)]),
  );
  let bestGroup: LocatedRoom[] = [];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const room of rooms) {
    const roomPixel = pixels.get(room.id);
    if (!roomPixel) continue;

    const group: LocatedRoom[] = [];
    let totalDistance = 0;
    for (const other of rooms) {
      const otherPixel = pixels.get(other.id);
      if (!otherPixel) continue;

      const distance = pixelDistance(roomPixel, otherPixel);
      if (distance <= CLUSTER_RADIUS_PX) {
        group.push(other);
        totalDistance += distance;
      }
    }

    if (group.length > bestGroup.length || (group.length === bestGroup.length && totalDistance < bestDistance)) {
      bestGroup = group;
      bestDistance = totalDistance;
    }
  }

  return bestGroup;
}

// 화면에서 거의 겹치는 핀만 가볍게 묶습니다. 한 페이지(약 십여 개)라 단순 그리디로 충분합니다.
function clusterPoints(rooms: LocatedRoom[], zoom: number): PointCluster[] {
  const clusters: PointCluster[] = [];
  const used = new Set<number>();
  const effectiveZoom = Math.max(zoom, MAP_MIN_ZOOM);
  const pixels = new globalThis.Map<number, PixelPoint>(
    rooms.map((room) => [room.id, toWorldPixel(room, effectiveZoom)]),
  );

  for (const room of rooms) {
    if (used.has(room.id)) continue;
    used.add(room.id);
    const group = [room];
    const roomPixel = pixels.get(room.id);
    if (!roomPixel) continue;
    for (const other of rooms) {
      if (used.has(other.id)) continue;
      const otherPixel = pixels.get(other.id);
      if (otherPixel && pixelDistance(roomPixel, otherPixel) <= CLUSTER_RADIUS_PX) {
        used.add(other.id);
        group.push(other);
      }
    }
    const { lat, lng } = averagePosition(group);
    clusters.push({ rooms: group, lat, lng });
  }
  return clusters;
}

interface SearchedView {
  center: { lat: number; lng: number };
  zoom: number;
}

// 직전에 "검색한" 뷰포트와 현재 뷰포트를 비교해, 재검색할 만큼 의미 있게 움직였는지 판단한다.
// 줌이 바뀌면 항상 true(위치 드릴다운 정확도 유지), 그 외에는 뷰포트 크기 대비 패닝 거리로 판단한다.
function isSignificantMove(
  prev: SearchedView | null,
  center: { lat: number; lng: number },
  zoom: number,
  bounds: MapBounds,
): boolean {
  if (!prev) return true;
  if (Math.round(prev.zoom) !== Math.round(zoom)) return true;
  const latSpan = Math.abs(bounds.north - bounds.south) || 1e-9;
  const lngSpan = Math.abs(bounds.east - bounds.west) || 1e-9;
  const dLat = Math.abs(center.lat - prev.center.lat);
  const dLng = Math.abs(center.lng - prev.center.lng);
  return dLat > latSpan * SIGNIFICANT_MOVE_RATIO || dLng > lngSpan * SIGNIFICANT_MOVE_RATIO;
}

export function RoomResultsMap(props: RoomResultsMapProps) {
  if (!isMapsConfigured) {
    return (
      <div className="results-map results-map--fallback">
        <span className="muted">지도를 표시하려면 Google Maps 설정이 필요합니다.</span>
      </div>
    );
  }
  return <RoomResultsMapView {...props} />;
}

function RoomResultsMapView({
  rooms,
  selectedId,
  hoveredId,
  viewedIds,
  onSelect,
  onHover,
  onSearchArea,
  fitBoundsTarget,
  onFitConsumed,
  suppressInitialSearch = false,
}: RoomResultsMapProps) {
  const status = useApiLoadingStatus();
  // reuseMaps 로 재사용되는 지도 인스턴스(재진입 시에도 동일 인스턴스를 가리킴).
  const map = useMap();
  const [zoom, setZoom] = useState(DEFAULT_KOREA_ZOOM);
  const [autoSearch, setAutoSearch] = useState(true);
  const [hasMoved, setHasMoved] = useState(false);
  const latestBounds = useRef<MapBounds | null>(null);
  const latestCenter = useRef<{ lat: number; lng: number } | null>(null);
  const latestZoom = useRef(DEFAULT_KOREA_ZOOM);
  // 마지막으로 실제 "검색한" 뷰포트(중심+줌). 이동량 임계치 판단의 기준점.
  const lastSearched = useRef<SearchedView | null>(null);
  const cameraMoved = useRef(false);
  const cameraInitialized = useRef(false);

  // 현재 영역으로 검색하고, 임계치 비교 기준이 될 뷰포트를 갱신합니다.
  function runSearch() {
    const bounds = latestBounds.current;
    const center = latestCenter.current;
    if (!bounds || !center) return;
    onSearchArea(bounds);
    lastSearched.current = { center, zoom: latestZoom.current };
  }

  // "이 지역 검색" 버튼: 이동량과 무관하게 항상 검색합니다.
  function searchCurrentArea() {
    if (!latestBounds.current) return;
    runSearch();
    onSelect(null);
    setHasMoved(false);
  }

  function handleIdle() {
    const bounds = latestBounds.current;
    const center = latestCenter.current;
    if (!cameraInitialized.current) {
      cameraInitialized.current = true;
      cameraMoved.current = false;
      // 초기 1회: 현재 보이는 영역으로 검색해 첫 결과를 띄웁니다.
      if (bounds && center && !suppressInitialSearch) runSearch();
      return;
    }
    if (!cameraMoved.current) return;
    cameraMoved.current = false;

    if (!autoSearch) {
      setHasMoved(true);
      return;
    }
    // 자동 검색: 의미 있는 이동(줌 변경 또는 충분한 패닝)일 때만 재검색해, 사소한 움직임에
    // 누적된 결과·스크롤이 리셋되지 않게 합니다.
    if (bounds && center && isSignificantMove(lastSearched.current, center, latestZoom.current, bounds)) {
      runSearch();
    }
  }

  // 지도 재사용(reuseMaps)으로 재진입하면 카메라가 그대로라 onCameraChanged/onIdle 가 다시
  // 발생하지 않아, 위 이벤트 기반 초기 검색(handleIdle)이 한 번도 실행되지 않을 수 있다
  // (목록이 빈 채 지도만 보이는 증상). 지도가 준비되면 현재 영역을 직접 읽어 초기 검색을 보장한다.
  useEffect(() => {
    if (!map || suppressInitialSearch || lastSearched.current) return;
    const bounds = map.getBounds();
    const center = map.getCenter();
    // 신규 생성 직후엔 아직 영역이 잡히지 않을 수 있다 — 그 경우는 onIdle 가 첫 검색을 처리한다.
    if (!bounds || !center) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    latestBounds.current = { north: ne.lat(), east: ne.lng(), south: sw.lat(), west: sw.lng() };
    latestCenter.current = { lat: center.lat(), lng: center.lng() };
    latestZoom.current = map.getZoom() ?? latestZoom.current;
    cameraInitialized.current = true;
    runSearch();
    // map 이 준비되는 시점에 한 번만 시도한다(이후는 카메라 이벤트가 처리).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="results-map results-map--fallback">
        <span className="muted">지도를 불러오지 못했습니다.</span>
      </div>
    );
  }

  return (
    <div className="results-map">
      <Map
        defaultCenter={DEFAULT_KOREA_CENTER}
        defaultZoom={DEFAULT_KOREA_ZOOM}
        mapId={mapsConfig.mapId || undefined}
        gestureHandling="greedy"
        clickableIcons={false}
        mapTypeControl={false}
        minZoom={MAP_MIN_ZOOM}
        restriction={{ latLngBounds: KOREA_BOUNDS, strictBounds: false }}
        reuseMaps
        onCameraChanged={(event) => {
          latestBounds.current = event.detail.bounds;
          latestCenter.current = event.detail.center;
          latestZoom.current = event.detail.zoom;
          setZoom(Math.round(event.detail.zoom));
          if (cameraInitialized.current) cameraMoved.current = true;
        }}
        onDragstart={() => {
          cameraMoved.current = true;
        }}
        onZoomChanged={() => {
          if (cameraInitialized.current) cameraMoved.current = true;
        }}
        onIdle={handleIdle}
        onClick={() => onSelect(null)}
      >
        <MapContent
          rooms={rooms}
          zoom={zoom}
          selectedId={selectedId}
          hoveredId={hoveredId}
          viewedIds={viewedIds}
          onSelect={onSelect}
          onHover={onHover}
          fitBoundsTarget={fitBoundsTarget}
          onFitConsumed={onFitConsumed}
        />
      </Map>

      <label className="map-autosearch-toggle">
        <input
          type="checkbox"
          checked={autoSearch}
          onChange={(event) => {
            setAutoSearch(event.target.checked);
            setHasMoved(false);
          }}
        />
        지도 이동 시 검색
      </label>

      {!autoSearch && hasMoved ? (
        <button type="button" className="search-here" onClick={searchCurrentArea}>
          <Search size={16} aria-hidden="true" />
          이 지역 검색
        </button>
      ) : null}
    </div>
  );
}

interface MapContentProps extends Omit<RoomResultsMapProps, 'onSearchArea'> {
  zoom: number;
}

function MapContent({
  rooms,
  zoom,
  selectedId,
  hoveredId,
  viewedIds,
  onSelect,
  onHover,
  fitBoundsTarget,
  onFitConsumed,
}: MapContentProps) {
  const map = useMap();

  // 통제된 단발성 fit: 부모가 fitBoundsTarget(지역 검색 결과 영역)을 줄 때만 카메라를 한 번 맞추고 비웁니다.
  useEffect(() => {
    if (!map || !fitBoundsTarget) {
      return;
    }
    map.fitBounds(
      {
        north: fitBoundsTarget.north,
        south: fitBoundsTarget.south,
        east: fitBoundsTarget.east,
        west: fitBoundsTarget.west,
      },
      60,
    );
    onFitConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitBoundsTarget]);

  const located = useMemo(() => rooms.filter(hasCoords), [rooms]);
  const pointClusters = useMemo(() => clusterPoints(located, zoom), [located, zoom]);

  const selectedRoom = located.find((room) => room.id === selectedId) ?? null;
  const selectedIsSingle =
    selectedRoom != null && pointClusters.some((c) => c.rooms.length === 1 && c.rooms[0].id === selectedRoom.id);

  function zoomIntoCluster(cluster: PointCluster) {
    if (!map) return;
    const focusRooms = densestNeighborhood(cluster.rooms, map.getZoom() ?? zoom);
    const lats = focusRooms.map((room) => room.latitude);
    const lngs = focusRooms.map((room) => room.longitude);
    const north = Math.max(...lats);
    const south = Math.min(...lats);
    const east = Math.max(...lngs);
    const west = Math.min(...lngs);
    // 좌표가 사실상 동일하면 fitBounds 가 의미 없으므로 한 단계 더 깊게 줌인합니다.
    if (north === south && east === west) {
      map.panTo({ lat: north, lng: east });
      map.setZoom(Math.min((map.getZoom() ?? zoom) + 2, 18));
      return;
    }
    map.fitBounds({ north, south, east, west }, 60);
  }

  return (
    <>
      {pointClusters.map((cluster) => {
        if (cluster.rooms.length === 1) {
          const room = cluster.rooms[0];
          return (
            <AdvancedMarker
              key={room.id}
              position={{ lat: room.latitude, lng: room.longitude }}
              anchorPoint={PRICE_MARKER_ANCHOR}
              zIndex={room.id === selectedId ? 60 : room.id === hoveredId ? 20 : 10}
              onClick={() => onSelect(room.id)}
            >
              <div onMouseEnter={() => onHover(room.id)} onMouseLeave={() => onHover(null)}>
                <RoomPriceMarker
                  price={room.pricePerNight}
                  available={room.isAvailable}
                  selected={room.id === selectedId}
                  hovered={room.id === hoveredId}
                  viewed={viewedIds.has(room.id)}
                  rating={room.rating}
                />
              </div>
            </AdvancedMarker>
          );
        }

        const prices = cluster.rooms.map((room) => room.pricePerNight);
        return (
          <AdvancedMarker
            key={`p-${cluster.rooms.map((room) => room.id).join('-')}`}
            position={{ lat: cluster.lat, lng: cluster.lng }}
            anchorPoint={['50%', '50%']}
            zIndex={40}
            onClick={() => zoomIntoCluster(cluster)}
          >
            <RoomClusterMarker count={cluster.rooms.length} min={Math.min(...prices)} max={Math.max(...prices)} />
          </AdvancedMarker>
        );
      })}

      {selectedRoom && selectedIsSingle ? (
        <AdvancedMarker
          position={{ lat: selectedRoom.latitude, lng: selectedRoom.longitude }}
          anchorPoint={INFO_CARD_ANCHOR}
          zIndex={50}
        >
          <RoomMapInfoCard room={selectedRoom} onClose={() => onSelect(null)} />
        </AdvancedMarker>
      ) : null}
    </>
  );
}
