import { useQuery } from '@tanstack/react-query';
import { getRoomReviews } from './reviewsApi';

export function useRoomReviewsQuery(roomId: number) {
  return useQuery({
    queryKey: ['reviews', 'list', roomId],
    queryFn: () => getRoomReviews(roomId),
  });
}