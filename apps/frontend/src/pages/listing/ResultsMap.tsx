import { useState, useEffect, useRef } from 'react';
import { MapZoomControls } from '../../components/MapZoomControls';
import { won } from '../../shared/utils';
import { createMap, type MapController, type MarkerHandle, type Bounds } from '../../shared/map';
import type { ListingCardResponse } from '../../shared/api/generated/types.gen';

// 지도 영역을 가장자리에서 ratio(0~0.5)만큼 안으로 좁힘 — 바깥쪽 숙소 제외용
function insetBounds(b: Bounds, ratio: number): Bounds {
  const latPad = (b.north - b.south) * ratio;
  const lngPad = (b.east - b.west) * ratio;
  return {
    south: b.south + latPad,
    north: b.north - latPad,
    west: b.west + lngPad,
    east: b.east - lngPad,
  };
}

function setPinActive(el: HTMLElement, active: boolean) {
  el.style.background = active ? 'var(--ink-1)' : '#fff';
  el.style.color = active ? '#fff' : '';
  el.style.zIndex = active ? '10' : '';
  el.style.transform = active ? 'scale(1.08)' : 'scale(1)';
}

export function ResultsMap({
  cards,
  onOpen,
  hoveredId,
  likedIds,
  onBoundsChange,
  focusSignal = 0,
}: {
  cards: ListingCardResponse[];
  onOpen: (c: ListingCardResponse) => void;
  hoveredId: number | null;
  likedIds: Set<number>;
  onBoundsChange?: (bounds: Bounds) => void;
  // 검색 시마다 증가 — 지도를 결과 위치로 이동시키는 신호
  focusSignal?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapController | null>(null);
  const [ready, setReady] = useState(false);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  // 검색으로 지도를 옮기는 중에는 idle→재검색을 무시(이동된 지도가 API 유발 방지)
  const suppressUntilRef = useRef(0);
  // 검색 신호 받았으나 아직 결과가 안 온 경우, 다음 카드 렌더 때 이동
  const pendingFocusRef = useRef(false);

  // 결과 카드들이 모두 보이도록 지도 이동(프로그램적). 이동 동안 idle 억제
  function focusToCards() {
    const map = mapRef.current;
    if (!map) return;
    const coords = cards
      .filter(c => c.lat != null && c.lng != null)
      .map(c => ({ lat: c.lat!, lng: c.lng! }));
    if (coords.length === 0) return;
    // 즉시 이동. 이동 동안 idle→재검색 억제
    suppressUntilRef.current = Date.now() + 800;
    map.fitBounds(coords);
    pendingFocusRef.current = false;
  }
  const likedIdsRef = useRef(likedIds);
  likedIdsRef.current = likedIds;
  // listingId → 핀 DOM + 오버레이 핸들 + 하트 element
  const pinsRef = useRef<Map<number, { el: HTMLElement; handle: MarkerHandle; heart: HTMLElement }>>(
    new Map(),
  );
  const cardsKey = cards.map(c => c.id).join(',');
  const likedKey = [...likedIds].sort().join(',');

  // 지도 1회 생성
  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    let cleanupIdle: (() => void) | undefined;
    createMap(ref.current, { center: { lat: 37.495, lng: 127.04 }, level: 6 })
      .then(map => {
        if (cancelled) return;
        mapRef.current = map;
        setReady(true);
        // 지도 이동/줌이 멈추면 현재 영역을 부모에 알림(검색 조건 갱신)
        // 단, 검색으로 인한 프로그램적 이동은 억제(재검색 방지)
        cleanupIdle = map.onIdle(() => {
          if (Date.now() < suppressUntilRef.current) return;
          onBoundsChangeRef.current?.(insetBounds(map.getBounds(), 0.15));
        });
      })
      .catch(err => console.error(err));
    return () => {
      cancelled = true;
      cleanupIdle?.();
      mapRef.current = null;
    };
  }, []);

  // 검색 신호 → 다음 카드 렌더 시 지도 이동(pending만 세움).
  // 카드 effect보다 먼저 선언해야 같은 커밋(캐시된 결과)에서도 pending이 먼저 세팅됨
  useEffect(() => {
    if (focusSignal === 0) return;
    pendingFocusRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal]);

  // 카드(페이지) 변경 시 기존 마커 제거 후 새로 그림
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 지도는 사용자가 제어(map bounds 검색) — 결과로 지도를 옮기지 않고 마커만 다시 그림
    pinsRef.current.forEach(({ handle }) => handle.remove());
    pinsRef.current.clear();

    cards.forEach(c => {
      if (c.lat == null || c.lng == null) return;
      const el = document.createElement('div');
      el.style.cssText =
        'display:flex;align-items:center;gap:6px;background:#fff;border-radius:30px;box-shadow:0 2px 8px rgba(0,0,0,0.25);padding:8px 14px;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;transition:all 120ms ease;';
      const priceSpan = document.createElement('span');
      priceSpan.textContent = won(c.totalPrice ?? 0);
      const heart = document.createElement('span');
      heart.textContent = '♥';
      const isLiked = c.id != null && likedIdsRef.current.has(c.id);
      heart.style.cssText = `color:var(--brand-coral);font-size:13px;display:${isLiked ? 'inline' : 'none'};`;
      el.append(priceSpan, heart);
      const handle = map.addHtmlMarker({
        coord: { lat: c.lat, lng: c.lng },
        element: el,
        onClick: () => onOpenRef.current(c),
        yAnchor: 1.4,
      });
      el.addEventListener('mouseenter', () => {
        handle.setZIndex(10);
        setPinActive(el, true);
      });
      el.addEventListener('mouseleave', () => {
        handle.setZIndex(0);
        setPinActive(el, false);
      });
      if (c.id != null) pinsRef.current.set(c.id, { el, handle, heart });
    });

    // 검색 직후 결과가 도착했으면 그 결과로 지도 이동
    if (pendingFocusRef.current) focusToCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cardsKey]);

  // 카드 hover → 해당 핀 강조 + 맨 앞으로
  useEffect(() => {
    pinsRef.current.forEach(({ el, handle }, id) => {
      const active = id === hoveredId;
      handle.setZIndex(active ? 10 : 0);
      setPinActive(el, active);
    });
  }, [hoveredId]);

  // 위시리스트 상태 → 핀 가격 옆 하트 표시
  useEffect(() => {
    pinsRef.current.forEach(({ heart }, id) => {
      heart.style.display = likedIds.has(id) ? 'inline' : 'none';
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [likedKey]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      <MapZoomControls
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
      />
    </div>
  );
}
