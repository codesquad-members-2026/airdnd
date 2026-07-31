import { request } from '../../../shared/api/httpClient';
import {
  RoomDetail,
  RoomSearchParams,
  RoomSummaryPage,
  roomDetailSchema,
  roomSummaryPageSchema,
} from '../model/roomTypes';

// 백엔드 응답은 평균 평점을 averageRating(후기 없으면 null)으로 내려주지만,
// 프론트 도메인/스키마는 rating 을 사용합니다. 파싱 전에 키를 맞춰줍니다.
// 위시리스트 룸 목록 등 RoomSummary 를 받는 다른 도메인에서도 재사용합니다.
export function withRating(raw: unknown) {
  if (raw && typeof raw === 'object' && 'averageRating' in raw) {
    const { averageRating, ...rest } = raw as Record<string, unknown>;
    return { ...rest, rating: averageRating ?? undefined };
  }
  return raw;
}

function toQuery(params: RoomSearchParams): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// 커서 페이지네이션 목록. 한 페이지(items)와 다음 커서를 함께 받습니다.
export async function getRooms(params: RoomSearchParams): Promise<RoomSummaryPage> {
  const data = await request<unknown>(`/api/rooms${toQuery(params)}`);
  const page = (data ?? {}) as { items?: unknown };
  const normalized =
    Array.isArray(page.items) ? { ...page, items: page.items.map(withRating) } : data;
  return roomSummaryPageSchema.parse(normalized);
}

export async function getRoom(roomId: number) {
  const data = await request<RoomDetail>(`/api/rooms/${roomId}`);
  return roomDetailSchema.parse(withRating(data));
}

export interface RoomUpdateRequest {
  name: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  allowsInfants: boolean;
  allowsPets: boolean;
  amenities: string[];
  imageUrls: string[];
}

export async function updateRoom(roomId: number, input: RoomUpdateRequest) {
  const data = await request<RoomDetail>(`/api/rooms/${roomId}`, {
    method: 'PATCH',
    body: input,
  });
  return roomDetailSchema.parse(withRating(data));
}
