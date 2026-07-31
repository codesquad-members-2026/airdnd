import { z } from 'zod';
import { cursorPageSchema } from '../../../shared/api/cursorPage';

export const roomSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  region: z.string(),
  address: z.string(),
  pricePerNight: z.number(),
  maxGuests: z.number(),
  imageUrl: z.string().url().or(z.literal('')),
  isAvailable: z.boolean(),
  allowsPets: z.boolean(),
  // 지도 검색용 좌표. 백엔드 목록 응답(RoomResponse)이 추가하기 전까지는 없을 수 있어 optional 입니다.
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  // 백엔드가 집계한 평점/후기 수. 백엔드 응답의 averageRating 은 roomsApi 에서 rating 으로 변환해 들어옵니다.
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
});

export const roomDetailSchema = roomSummarySchema.extend({
  description: z.string(),
  amenities: z.array(z.string()),
  imageUrls: z.array(z.string().url()).optional(),
  hostName: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  allowsInfants: z.boolean().optional().default(false),
});

export const roomSearchParamsSchema = z.object({
  region: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
  infants: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  allowsPets: z.boolean().optional(),
  // 지도 뷰포트 검색용 경계 좌표. 4개를 함께 보내면 백엔드가 해당 영역 안의 숙소만 반환합니다.
  // (south/west/north/east 파라미터와 1:1. 목록(GET /api/rooms)·지도(GET /api/rooms/map) 공용)
  south: z.number().min(-90).max(90).optional(),
  west: z.number().min(-180).max(180).optional(),
  north: z.number().min(-90).max(90).optional(),
  east: z.number().min(-180).max(180).optional(),
  // 목록 커서 페이지네이션: 다음 페이지 커서(불투명 문자열)와 페이지 크기.
  cursor: z.string().optional(),
  size: z.number().int().min(1).max(100).optional(),
});

export type RoomSummary = z.infer<typeof roomSummarySchema>;
export type RoomDetail = z.infer<typeof roomDetailSchema>;
export type RoomSearchParams = z.infer<typeof roomSearchParamsSchema>;

// 커서 페이지 스키마 팩토리는 shared/api/cursorPage 로 옮겼다(여러 도메인 공용).
// 기존 import 호환을 위해 여기서도 re-export 한다.
export { cursorPageSchema };

export const roomSummaryPageSchema = cursorPageSchema(roomSummarySchema);
export type RoomSummaryPage = z.infer<typeof roomSummaryPageSchema>;
