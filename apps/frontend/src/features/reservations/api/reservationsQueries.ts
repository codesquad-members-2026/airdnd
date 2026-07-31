import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createReservation,
  cancelReservation,
  getReservation,
  getReservationCounts,
  getReservations,
  getRoomBookedDates,
} from './reservationsApi';
import { GuestReservationTab } from '../model/reservationTypes';
import { roomQueryKeys } from '../../rooms/api/roomsQueries';

export const reservationQueryKeys = {
  listPrefix: ['reservations', 'list'] as const,
  // 탭별로 별도 캐시 — 탭 전환 시 각각 무한 스크롤 상태를 유지한다.
  list: (tab: GuestReservationTab) => ['reservations', 'list', tab] as const,
  counts: ['reservations', 'counts'] as const,
  detail: (reservationId: number) => ['reservations', 'detail', reservationId] as const,
  bookedDates: (roomId: number) => ['reservations', 'booked-dates', roomId] as const,
};

export function useRoomBookedDatesQuery(roomId: number) {
  return useQuery({
    queryKey: reservationQueryKeys.bookedDates(roomId),
    queryFn: () => getRoomBookedDates(roomId),
    enabled: Number.isFinite(roomId),
  });
}

// 선택된 탭의 예약 목록을 커서 무한 스크롤로 불러온다.
export function useReservationsQuery(tab: GuestReservationTab) {
  return useInfiniteQuery({
    queryKey: reservationQueryKeys.list(tab),
    queryFn: ({ pageParam }) => getReservations({ tab, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor ?? undefined : undefined),
  });
}

// 탭 배지용 카운트 요약. 탭과 무관한 전체 집계라 한 번만 받는다.
export function useReservationCountsQuery() {
  return useQuery({
    queryKey: reservationQueryKeys.counts,
    queryFn: getReservationCounts,
  });
}

export function useReservationQuery(reservationId: number) {
  return useQuery({
    queryKey: reservationQueryKeys.detail(reservationId),
    queryFn: () => getReservation(reservationId),
    enabled: Number.isFinite(reservationId),
  });
}

export function useCreateReservationMutation(roomId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      // ['reservations','list'] 프리픽스로 모든 탭 무한쿼리를 한 번에 무효화한다.
      queryClient.invalidateQueries({ queryKey: reservationQueryKeys.listPrefix });
      queryClient.invalidateQueries({ queryKey: reservationQueryKeys.counts });
      queryClient.invalidateQueries({ queryKey: reservationQueryKeys.bookedDates(roomId) });
      queryClient.invalidateQueries({ queryKey: roomQueryKeys.detail(roomId) });
    },
  });
}

export function useCancelReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      // 취소 시 예약이 다가오는→취소 탭으로 이동하므로 모든 탭 목록과 카운트를 무효화한다.
      queryClient.invalidateQueries({ queryKey: reservationQueryKeys.listPrefix });
      queryClient.invalidateQueries({ queryKey: reservationQueryKeys.counts });
      queryClient.invalidateQueries({ queryKey: ['reservations', 'booked-dates'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
