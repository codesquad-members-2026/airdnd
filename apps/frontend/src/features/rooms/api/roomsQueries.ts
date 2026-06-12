import { useQuery } from '@tanstack/react-query';
import { getRoom, getRooms } from './roomsApi';
import { RoomSearchParams } from '../model/roomTypes';

export const roomQueryKeys = {
  list: (params: RoomSearchParams) => ['rooms', 'list', params] as const,
  detail: (roomId: number) => ['rooms', 'detail', roomId] as const,
};

export function useRoomsQuery(params: RoomSearchParams) {
  return useQuery({
    queryKey: roomQueryKeys.list(params),
    queryFn: () => getRooms(params),
  });
}

export function useRoomQuery(roomId: number) {
  return useQuery({
    queryKey: roomQueryKeys.detail(roomId),
    queryFn: () => getRoom(roomId),
    enabled: Number.isFinite(roomId),
  });
}
