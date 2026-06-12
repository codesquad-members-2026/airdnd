import { request } from '../../../shared/api/httpClient';
import {
  CreateReservationPayload,
  Reservation,
  reservationSchema,
} from '../model/reservationTypes';

export async function getReservations() {
  const data = await request<Reservation[]>('/api/reservations');
  return reservationSchema.array().parse(data);
}

export async function getReservation(reservationId: number) {
  const data = await request<Reservation>(`/api/reservations/${reservationId}`);
  return reservationSchema.parse(data);
}

export async function createReservation(input: CreateReservationPayload) {
  const data = await request<number>('/api/reservations', {
    method: 'POST',
    body: input,
  });
  return data;
}

export async function cancelReservation(reservationId: number) {
  await request<void>(`/api/reservations/${reservationId}`, {
    method: 'DELETE',
  });
}
