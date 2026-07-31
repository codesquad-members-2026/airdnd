import { env } from '../../../shared/config/env';

export const mapsConfig = {
  apiKey: env.googleMapsApiKey,
  mapId: env.googleMapsMapId,
};

// 모든 지도에서 AdvancedMarker를 사용하므로 API 키와 Map ID가 모두 필요합니다.
export const isMapsConfigured = Boolean(mapsConfig.apiKey && mapsConfig.mapId);

// 전국 검색 초기 화면용 기본 중심/줌 (대한민국)
export const DEFAULT_KOREA_CENTER = { lat: 36.5, lng: 127.8 };
export const DEFAULT_KOREA_ZOOM = 7;

// 숙소 상세 위치 지도 기본 줌
export const DETAIL_MAP_ZOOM = 16;

// 브랜드 teardrop 핀의 좌표 기준점: 48x62 컨테이너 안 SVG 끝점(y≈56px).
export const ROOM_DETAIL_PIN_ANCHOR = {
  left: '-50%',
  top: '-56px',
} as const;
