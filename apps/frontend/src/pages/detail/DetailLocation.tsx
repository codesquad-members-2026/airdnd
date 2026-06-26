import { useEffect, useRef } from 'react';
import { createMap, type MapController } from '../../shared/map';
import { MapZoomControls } from '../../components/MapZoomControls';

interface DetailLocationProps {
  location: string;
  lat?: number;
  lng?: number;
}

// 이 레벨 이하(확대)에서만 반경 원 표시
const RADIUS_VISIBLE_LEVEL = 6;

// 레퍼런스: "위치" — 지도 + 지역명 + 안내. 좌표는 현재 목(서울 중심)
export function DetailLocation({ location, lat = 37.5012, lng = 127.0396 }: DetailLocationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapController | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    let cleanupIdle: (() => void) | undefined;
    createMap(ref.current, { center: { lat, lng }, level: 4, zoomable: false })
      .then(map => {
        if (cancelled) return;
        mapRef.current = map;
        // 원형 마커(레퍼런스): 꼬리 없는 검은 원 + 흰 집 아이콘
        const el = document.createElement('div');
        el.style.cssText =
          'width:52px;height:52px;border-radius:50%;background:#222;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
        el.innerHTML =
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 3 3 10.5V21a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1V10.5z"/></svg>';
        map.addHtmlMarker({ coord: { lat, lng }, element: el, onClick: () => {}, yAnchor: 0.5 });

        // 반경 300m 원 — 충분히 확대됐을 때(레벨 ≤ 6)만 표시
        const circle = map.addCircle({ lat, lng }, 300);
        const updateCircle = () => circle.setVisible(map.getLevel() <= RADIUS_VISIBLE_LEVEL);
        updateCircle();
        cleanupIdle = map.onIdle(updateCircle);
      })
      .catch(err => console.error(err));
    return () => {
      cancelled = true;
      cleanupIdle?.();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div style={{ padding: '40px 0', borderTop: '1px solid var(--line)' }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>위치</h2>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 420,
          borderRadius: 16,
          overflow: 'hidden',
          background: '#E8EDF0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        }}
      >
        <div ref={ref} style={{ width: '100%', height: '100%' }} />
        <MapZoomControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
        />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 18 }}>{location}</div>
      <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.6 }}>
        정확한 위치는 예약 확정 후에 안내해 드려요. 주변에 대중교통과 편의시설이 가까워 이동이 편리합니다.
      </div>
    </div>
  );
}
