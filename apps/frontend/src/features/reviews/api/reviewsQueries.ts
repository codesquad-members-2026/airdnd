import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createReview, getRoomReviews } from './reviewsApi';
import { reservationQueryKeys } from '../../reservations/api/reservationsQueries';
import type { CreateReviewFormValues } from '../model/reviewTypes';

export const reviewQueryKeys = {
  list: (roomId: number) => ['reviews', 'list', roomId] as const,
};

export function useRoomReviewsQuery(roomId: number) {
  return useQuery({
    queryKey: reviewQueryKeys.list(roomId),
    queryFn: () => getRoomReviews(roomId),
  });
}

export function useCreateReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      values,
    }: {
      reservationId: number;
      roomId: number;
      values: CreateReviewFormValues;
    }) => createReview(reservationId, values),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.list(roomId) });
      // 예약 목록의 hasReview를 갱신해 작성 완료가 즉시 반영되도록(모든 탭 무한쿼리 prefix 무효화)
      queryClient.invalidateQueries({ queryKey: reservationQueryKeys.listPrefix });
    },
  });
}
