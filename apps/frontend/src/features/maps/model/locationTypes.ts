import { z } from 'zod';

// 좌표 범위 검증 (프론트엔드/백엔드 양쪽에서 검증해야 함)
export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);
export const countryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, '국가 코드는 대문자 ISO 2자리 코드여야 합니다.');

export const coordinatesSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export type Coordinates = z.infer<typeof coordinatesSchema>;

export const selectedLocationSchema = coordinatesSchema.extend({
  address: z.string().min(1),
  region: z.string().min(1),
  countryCode: countryCodeSchema,
});

export type SelectedLocation = z.infer<typeof selectedLocationSchema>;

// Google Maps의 LatLngLiteral과 구조적으로 호환되는 좌표 타입
export type LatLng = { lat: number; lng: number };

// 지도 뷰포트(보이는 영역)의 경계 좌표. Google Maps onCameraChanged 의 bounds 와
// 동일한 구조이며, 백엔드 GET /api/rooms 의 south/west/north/east 파라미터와 1:1로 매핑됩니다.
export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

// 우리 도메인 좌표({latitude,longitude}) ↔ Google Maps({lat,lng}) 변환
export function toLatLng(coords: Coordinates): LatLng {
  return { lat: coords.latitude, lng: coords.longitude };
}

export function fromLatLng(latLng: LatLng): Coordinates {
  return { latitude: latLng.lat, longitude: latLng.lng };
}
