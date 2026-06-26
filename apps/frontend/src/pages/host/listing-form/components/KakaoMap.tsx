import { useEffect, useRef } from 'react';
import mapPin from '../../../../assets/map-pin.svg';

let sdkPromise: Promise<void> | null = null;

export function loadKakaoMapsSDK(): Promise<void> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    // 이미 초기화된 경우
    if (window.kakao?.maps?.services) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_JS_KEY}&libraries=services&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('Kakao Maps SDK 로드 실패'));
    };
    document.head.appendChild(script);
  });

  return sdkPromise;
}

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
