import { request } from '../../../shared/api/httpClient';
import {
  HostRoom,
  HostRoomFormInput,
  HostRoomStatus,
  hostRoomSchema,
} from '../model/hostRoomTypes';

export async function getHostRooms() {
  const data = await request<HostRoom[]>('/api/host/rooms');
  return hostRoomSchema.array().parse(data);
}

export async function getHostRoom(roomId: number) {
  const data = await request<HostRoom>(`/api/host/rooms/${roomId}`);
  return hostRoomSchema.parse(data);
}

export async function createHostRoom(input: HostRoomFormInput) {
  const data = await request<number>('/api/host/rooms', {
    method: 'POST',
    body: normalizeHostRoomPayload(input),
  });
  return data;
}

export async function updateHostRoom(roomId: number, input: HostRoomFormInput) {
  const data = await request<HostRoom>(`/api/host/rooms/${roomId}`, {
    method: 'PUT',
    body: normalizeHostRoomPayload(input),
  });
  return hostRoomSchema.parse(data);
}

export async function updateHostRoomStatus(roomId: number, status: HostRoomStatus) {
  const data = await request<HostRoom>(`/api/host/rooms/${roomId}/status`, {
    method: 'PATCH',
    body: { status },
  });
  return hostRoomSchema.parse(data);
}

function normalizeHostRoomPayload(input: HostRoomFormInput) {
  return {
    ...input,
    amenities: input.amenitiesText
      ?.split(',')
      .map((amenity) => amenity.trim())
      .filter(Boolean),
    imageUrls: input.imageUrlsText
      ?.split(',')
      .map((url) => url.trim())
      .filter(Boolean),
    countryCode: 'KR',
    latitude: 37.5665,
    longitude: 126.978,
  };
}
