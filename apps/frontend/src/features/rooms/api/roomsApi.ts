import { request } from '../../../shared/api/httpClient';
import {
  RoomDetail,
  RoomSearchParams,
  RoomSummary,
  roomDetailSchema,
  roomSummarySchema,
} from '../model/roomTypes';

export async function getRooms(params: RoomSearchParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  const data = await request<RoomSummary[]>(`/api/rooms${query ? `?${query}` : ''}`);
  return roomSummarySchema.array().parse(data);
}

export async function getRoom(roomId: number) {
  const data = await request<RoomDetail>(`/api/rooms/${roomId}`);
  return roomDetailSchema.parse(data);
}
