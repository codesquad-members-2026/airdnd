import { useEffect, useRef } from 'react';
import mapPin from '../../../../assets/map-pin.svg';
import { loadMapSdk } from '../../../../shared/map';

// 기존 호출부 호환용 별칭. SDK 로더는 추상화 레이어(shared/map)로 일원화.
export const loadKakaoMapsSDK = loadMapSdk;

interface KakaoMapProps {
  address: string;
  onCoordinatesChange: (lat: number, lng: number) => void;
}

export function KakaoMap({ address, onCoordinatesChange }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCoordinatesChange);
  callbackRef.current = onCoordinatesChange;

  useEffect(() => {
    if (!containerRef.current || !address) return;

    let cancelled = false;

    loadKakaoMapsSDK()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const geocoder = new window.kakao.maps.services.Geocoder();

        geocoder.addressSearch(address, (result, status) => {
          if (cancelled || !containerRef.current) return;
          if (status !== window.kakao.maps.services.Status.OK) return;

          const lat = parseFloat(result[0].y);
          const lng = parseFloat(result[0].x);
          const position = new window.kakao.maps.LatLng(lat, lng);

          const map = new window.kakao.maps.Map(containerRef.current!, {
            center: position,
            level: 3,
          });

          callbackRef.current(lat, lng);

          window.kakao.maps.event.addListener(map, 'idle', () => {
            const center = map.getCenter();
            callbackRef.current(center.getLat(), center.getLng());
          });
        });
      })
      .catch(err => {
        console.error(err);
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '11 / 10', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        <img
          src={mapPin}
          alt=""
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -100%)',
            width: 32,
            height: 40,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      </div>
      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
        지도를 움직여 핀을 정확한 위치에 맞춰 주세요.
      </p>
    </div>
  );
}
