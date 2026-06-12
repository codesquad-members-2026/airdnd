import { request } from '../../../shared/api/httpClient';
import { Review, reviewResponseSchema } from '../model/reviewTypes';
import { z } from 'zod';

export async function getRoomReviews(roomId: number) {
  const data = await request<Review[]>(`/api/rooms/${roomId}/reviews`);
  return z.array(reviewResponseSchema).parse(data);
}