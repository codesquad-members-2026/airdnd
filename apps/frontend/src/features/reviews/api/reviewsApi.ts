import { request } from '../../../shared/api/httpClient';
import { CreateReviewFormValues, Review, reviewResponseSchema } from '../model/reviewTypes';
import { z } from 'zod';

export async function getRoomReviews(roomId: number) {
  const data = await request<Review[]>(`/api/rooms/${roomId}/reviews`);
  return z.array(reviewResponseSchema).parse(data);
}

export async function createReview(reservationId: number, input: CreateReviewFormValues) {
  const data = await request<Review>(`/api/reservations/${reservationId}/reviews`, {
    method: 'POST',
    body: input,
  });
  return reviewResponseSchema.parse(data);
}