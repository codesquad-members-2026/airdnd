import { useEffect, useRef } from 'react';
import { Icon } from '../../../shared/Icon';
import { loadKakaoMapsSDK } from '../../host/listing-form/components/KakaoMap';

interface StayMapProps {
  lat?: number;
  lng?: number;
  label: string;
  dateRange: string;
}

function pinContent(label: string, dateRange: string): string {
  const house =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  return `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:#fff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.18);padding:8px 14px;text-align:center;white-space:nowrap;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:700;color:#222;">${label}</div>
        <div style="font-size:12px;color:#717171;margin-top:2px;">${dateRange}</div>
      </div>
      <div style="width:48px;height:48px;border-radius:50%;background:#222;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.3);">
        ${house}
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid #222;margin-top:-2px;"></div>
    </div>`;
}

const MIN_LEVEL = 1;
const MAX_LEVEL = 10;

/** 우측 고정 지도 — 좌표 있으면 카카오맵(커스텀 핀), 없으면 placeholder */
export function StayMap({ lat, lng, label, dateRange }: StayMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const hasCoords = lat != null && lng != null;

  useEffect(() => {
    if (!hasCoords || !ref.current) return;
    let cancelled = false;
    const container = ref.current;

    // 휠 줌은 커서 기준이라 끄고, 중앙 기준으로 직접 처리
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const map = mapRef.current;
      if (!map) return;
      const next = map.getLevel() + (e.deltaY > 0 ? 1 : -1);
      map.setLevel(Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, next)), {
        animate: { duration: 200 },
      });
    };

    loadKakaoMapsSDK()
      .then(() => {
        if (cancelled || !ref.current) return;
        const position = new window.kakao.maps.LatLng(lat!, lng!);
        const map = new window.kakao.maps.Map(ref.current, { center: position, level: 4 });
        map.setZoomable(false);
        mapRef.current = map;
        new window.kakao.maps.CustomOverlay({
          map,
          position,
          content: pinContent(label, dateRange),
          xAnchor: 0.5,
          yAnchor: 1,
        });
        container.addEventListener('wheel', onWheel, { passive: false });
      })
      .catch(err => console.error(err));

    return () => {
      cancelled = true;
      container.removeEventListener('wheel', onWheel);
      mapRef.current = null;
    };
  }, [hasCoords, lat, lng, label, dateRange]);

  const zoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    const next = map.getLevel() + delta;
    map.setLevel(Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, next)), {
      animate: { duration: 200 },
    });
  };

  return (
    <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 80px)' }}>
      {hasCoords ? (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div ref={ref} style={{ width: '100%', height: '100%' }} />
          <ZoomControls onZoomIn={() => zoom(-1)} onZoomOut={() => zoom(1)} />
        </div>
      ) : (
        <Placeholder label={label} />
      )}
    </div>
  );
}

function ZoomControls({ onZoomIn, onZoomOut }: { onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}
    >
      <ZoomButton label="확대" onClick={onZoomIn}>
        <Icon name="plus" size={18} />
      </ZoomButton>
      <div style={{ height: 1, background: 'var(--line)' }} />
      <ZoomButton label="축소" onClick={onZoomOut}>
        <Icon name="minus" size={18} />
      </ZoomButton>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 40,
        height: 40,
        border: 'none',
        background: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
    >
      {children}
    </button>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'repeating-linear-gradient(0deg, #e9efe9 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, #e9efe9 0 1px, transparent 1px 64px), linear-gradient(135deg, #eef3ee, #e3ebe6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--ink-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
        }}
        title={label}
      >
        <Icon name="map-pin" size={26} color="#fff" />
      </div>
    </div>
  );
}
