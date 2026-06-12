import { differenceInCalendarDays, parseISO } from 'date-fns';
import { http, HttpResponse } from 'msw';
import { mockReservations, mockRooms } from '../fixtures/mockData';
import { getMockUser } from './authHandlers';

export const reservationHandlers = [
  http.get('/api/reservations', () => {
    if (!getMockUser()) {
      return unauthorized();
    }

    return HttpResponse.json(mockReservations);
  }),
  http.get('/api/reservations/:reservationId', ({ params }) => {
    if (!getMockUser()) {
      return unauthorized();
    }

    const reservation = mockReservations.find((item) => item.id === Number(params.reservationId));

    if (!reservation) {
      return HttpResponse.json(
        { code: 'RESERVATION_NOT_FOUND', message: '예약을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json(reservation);
  }),
  http.post('/api/reservations', async ({ request }) => {
    if (!getMockUser()) {
      return unauthorized();
    }

    const body = (await request.json()) as {
      roomId: number;
      checkIn: string;
      checkOut: string;
      guests: number;
    };
    const room = mockRooms.find((item) => item.id === body.roomId);

    if (!room) {
      return HttpResponse.json(
        { code: 'ROOM_NOT_FOUND', message: '숙소를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    if (body.guests > room.maxGuests) {
      return HttpResponse.json(
        { code: 'TOO_MANY_GUESTS', message: '최대 인원을 초과했습니다.' },
        { status: 409 },
      );
    }

    const nights = differenceInCalendarDays(parseISO(body.checkOut), parseISO(body.checkIn));
    const reservation = {
      id: Date.now(),
      roomId: room.id,
      roomName: room.name,
      roomImageUrl: room.imageUrl,
      region: room.region,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      guests: body.guests,
      totalPrice: nights * room.pricePerNight,
      status: 'CONFIRMED' as const,
      guestName: getMockUser()?.name,
      createdAt: new Date().toISOString(),
    };

    mockReservations.unshift(reservation);
    return HttpResponse.json(reservation, { status: 201 });
  }),
  http.delete('/api/reservations/:reservationId', ({ params }) => {
    if (!getMockUser()) {
      return unauthorized();
    }

    const reservationId = Number(params.reservationId);
    const reservation = mockReservations.find((item) => item.id === reservationId);

    if (!reservation) {
      return HttpResponse.json(
        { code: 'RESERVATION_NOT_FOUND', message: '예약을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    reservation.status = 'CANCELED';
    return new HttpResponse(null, { status: 204 });
  }),
];

function unauthorized() {
  return HttpResponse.json(
    { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' },
    { status: 401 },
  );
}
