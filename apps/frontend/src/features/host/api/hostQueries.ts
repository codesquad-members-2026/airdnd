import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createHostRoom,
  getHostRoom,
  getHostRoomReservationCounts,
  getHostRoomReservations,
  getHostRooms,
  updateHostRoom,
  updateHostRoomStatus,
} from './hostApi';
import { HostRoomFormInput, HostRoomStatus } from '../model/hostRoomTypes';
import { ReservationStatusFilter } from '../../reservations/model/reservationTypes';
import { roomQueryKeys } from '../../rooms/api/roomsQueries';

export const hostQueryKeys = {
  list: ['host', 'rooms'] as const,
  detail: (roomId: number) => ['host', 'rooms', roomId] as const,
  // status 별로 별도 캐시 — 탭 전환 시 각각 무한 스크롤 상태를 유지한다.
  reservations: (roomId: number, status: ReservationStatusFilter) =>
    ['host', 'rooms', roomId, 'reservations', status] as const,
  reservationCounts: (roomId: number) =>
    ['host', 'rooms', roomId, 'reservations', 'counts'] as const,
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

// 선택된 상태 탭의 예약 목록을 커서 무한 스크롤로 불러온다.
export function useHostRoomReservationsQuery(
  roomId: number | undefined,
  status: ReservationStatusFilter,
) {
  const enabled = typeof roomId === 'number' && Number.isFinite(roomId);
  return useInfiniteQuery({
    queryKey: hostQueryKeys.reservations(roomId ?? 0, status),
    queryFn: ({ pageParam }) =>
      getHostRoomReservations({ roomId: roomId as number, status, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor ?? undefined : undefined),
    enabled,
  });
}

// 상태 탭 배지용 카운트 요약. 필터와 무관한 전체 집계라 status 와 별개로 한 번만 받는다.
export function useHostRoomReservationCountsQuery(roomId?: number) {
  return useQuery({
    queryKey: hostQueryKeys.reservationCounts(roomId ?? 0),
    queryFn: () => getHostRoomReservationCounts(roomId as number),
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
      // 비활성/활성 전환 시 공개 검색 목록·지도·상세(['rooms', ...])도 갱신해 캐시에 남지 않게 한다.
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
