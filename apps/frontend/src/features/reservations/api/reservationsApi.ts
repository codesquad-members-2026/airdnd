import { request } from '../../../shared/api/httpClient';
import {
  BookedDateRange,
  bookedDateRangeSchema,
  CreateReservationPayload,
  GuestReservationCounts,
  GuestReservationTab,
  guestReservationCountsSchema,
  Reservation,
  ReservationPage,
  reservationPageSchema,
  reservationSchema,
} from '../model/reservationTypes';

export async function getRoomBookedDates(roomId: number) {
  const data = await request<BookedDateRange[]>(`/api/reservations/rooms/${roomId}/booked-dates`);
  return bookedDateRangeSchema.array().parse(data);
}

interface GuestReservationsPageParams {
  tab: GuestReservationTab;
  cursor?: string;
}

// 본인 예약 목록을 탭별 커서 페이지로 조회한다. 서버가 오늘 기준 날짜 필터링·정렬을 담당한다.
export async function getReservations({
  tab,
  cursor,
}: GuestReservationsPageParams): Promise<ReservationPage> {
  const query = new URLSearchParams();
  // 백엔드 enum(UPCOMING/PAST/CANCELLED)에 맞춰 대문자로 보낸다.
  query.set('tab', tab.toUpperCase());
  if (cursor) query.set('cursor', cursor);

  const data = await request<unknown>(`/api/reservations?${query.toString()}`);
  return reservationPageSchema.parse(data);
}

// 탭 배지에 표시할 다가오는/지난/취소 카운트 요약.
export async function getReservationCounts(): Promise<GuestReservationCounts> {
  const data = await request<unknown>('/api/reservations/summary');
  return guestReservationCountsSchema.parse(data);
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
