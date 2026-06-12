import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createHostRoom,
  getHostRoom,
  getHostRooms,
  updateHostRoom,
  updateHostRoomStatus,
} from './hostApi';
import { HostRoomFormInput, HostRoomStatus } from '../model/hostRoomTypes';
import { roomQueryKeys } from '../../rooms/api/roomsQueries';

export const hostQueryKeys = {
  list: ['host', 'rooms'] as const,
  detail: (roomId: number) => ['host', 'rooms', roomId] as const,
};

export function useHostRoomsQuery() {
  return useQuery({
    queryKey: hostQueryKeys.list,
    queryFn: getHostRooms,
  });
}

export function useHostRoomQuery(roomId?: number) {
  return useQuery({
    queryKey: hostQueryKeys.detail(roomId ?? 0),
    queryFn: () => getHostRoom(roomId as number),
    enabled: typeof roomId === 'number' && Number.isFinite(roomId),
  });
}

export function useCreateHostRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHostRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useUpdateHostRoomMutation(roomId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HostRoomFormInput) => updateHostRoom(roomId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: hostQueryKeys.detail(roomId) });
      queryClient.invalidateQueries({ queryKey: roomQueryKeys.detail(roomId) });
    },
  });
}

export function useUpdateHostRoomStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, status }: { roomId: number; status: HostRoomStatus }) =>
      updateHostRoomStatus(roomId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hostQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: hostQueryKeys.detail(variables.roomId) });
      queryClient.invalidateQueries({ queryKey: roomQueryKeys.detail(variables.roomId) });
    },
  });
}
