import { http, HttpResponse } from 'msw';
import {
  mockAdminDashboard,
  mockAdminUsers,
  mockReservations,
  mockRooms,
  mockWaitlistSnapshot,
} from '../fixtures/mockData';
import { getMockUser } from './authHandlers';

export const adminHandlers = [
  http.get('/api/admin/dashboard', () => {
    const user = getMockUser();

    if (!user) {
      return HttpResponse.json(
        { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    if (user.role !== 'ADMIN') {
      return HttpResponse.json(
        { code: 'FORBIDDEN', message: '권한이 없습니다.' },
        { status: 403 },
      );
    }

    return HttpResponse.json(mockAdminDashboard);
  }),
  http.get('/api/admin/rooms/pending', () => {
    const guard = adminGuard();
    if (guard) return guard;

    return HttpResponse.json(mockRooms.filter((room) => room.status === 'PENDING_APPROVAL'));
  }),
  http.post('/api/admin/rooms/:roomId/approve', ({ params }) => {
    const guard = adminGuard();
    if (guard) return guard;

    const room = mockRooms.find((item) => item.id === Number(params.roomId));
    if (!room) {
      return HttpResponse.json(
        { code: 'ROOM_NOT_FOUND', message: '숙소를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    room.status = 'ACTIVE';
    return HttpResponse.json(room);
  }),
  http.post('/api/admin/rooms/:roomId/reject', ({ params }) => {
    const guard = adminGuard();
    if (guard) return guard;

    const room = mockRooms.find((item) => item.id === Number(params.roomId));
    if (!room) {
      return HttpResponse.json(
        { code: 'ROOM_NOT_FOUND', message: '숙소를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    room.status = 'INACTIVE';
    return HttpResponse.json(room);
  }),
  http.get('/api/admin/users', () => {
    const guard = adminGuard();
    if (guard) return guard;

    return HttpResponse.json(mockAdminUsers);
  }),
  http.get('/api/admin/reservations', () => {
    const guard = adminGuard();
    if (guard) return guard;

    return HttpResponse.json(mockReservations);
  }),
  http.get('/api/admin/waitlist', () => {
    const guard = adminGuard();
    if (guard) return guard;

    return HttpResponse.json(mockWaitlistSnapshot);
  }),
];

function adminGuard() {
  const user = getMockUser();

  if (!user) {
    return HttpResponse.json(
      { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }

  if (user.role !== 'ADMIN') {
    return HttpResponse.json(
      { code: 'FORBIDDEN', message: '권한이 없습니다.' },
      { status: 403 },
    );
  }

  return null;
}
