import { http, HttpResponse } from 'msw';
import { HostRoomStatus } from '../../features/host/model/hostRoomTypes';
import { mockRooms } from '../fixtures/mockData';
import { getMockUser } from './authHandlers';

export const hostHandlers = [
  http.get('/api/host/rooms', () => {
    const user = getMockUser();

    if (!user) {
      return unauthorized();
    }

    if (user.role !== 'HOST' && user.role !== 'ADMIN') {
      return forbidden();
    }

    return HttpResponse.json(mockRooms);
  }),
  http.get('/api/host/rooms/:roomId', ({ params }) => {
    const user = getMockUser();

    if (!user) {
      return unauthorized();
    }

    if (user.role !== 'HOST' && user.role !== 'ADMIN') {
      return forbidden();
    }

    const room = mockRooms.find((item) => item.id === Number(params.roomId));

    if (!room) {
      return HttpResponse.json(
        { code: 'ROOM_NOT_FOUND', message: '숙소를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json(room);
  }),
  http.post('/api/host/rooms', async ({ request }) => {
    const user = getMockUser();

    if (!user) {
      return unauthorized();
    }

    if (user.role !== 'HOST' && user.role !== 'ADMIN') {
      return forbidden();
    }

    const body = (await request.json()) as {
      name: string;
      region: string;
      address: string;
      description: string;
      pricePerNight: number;
      maxGuests: number;
      imageUrl: string;
      imageUrls?: string[];
      allowsPets?: boolean;
      amenities?: string[];
    };

    const room = {
      id: Date.now(),
      ...body,
      rating: 0,
      reviewCount: 0,
      isAvailable: true,
      allowsPets: body.allowsPets ?? false,
      hostName: user.name,
      latitude: 37.5665,
      longitude: 126.978,
      imageUrls: body.imageUrls ?? [],
      amenities: body.amenities ?? [],
      status: 'PENDING_APPROVAL' as const,
    };

    mockRooms.unshift(room);
    return HttpResponse.json(room, { status: 201 });
  }),
  http.put('/api/host/rooms/:roomId', async ({ params, request }) => {
    const user = getMockUser();

    if (!user) {
      return unauthorized();
    }

    if (user.role !== 'HOST' && user.role !== 'ADMIN') {
      return forbidden();
    }

    const room = mockRooms.find((item) => item.id === Number(params.roomId));

    if (!room) {
      return HttpResponse.json(
        { code: 'ROOM_NOT_FOUND', message: '숙소를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Partial<typeof room> & { amenities?: string[] };
    Object.assign(room, body, {
      amenities: body.amenities ?? room.amenities,
    });

    return HttpResponse.json(room);
  }),
  http.patch('/api/host/rooms/:roomId/status', async ({ params, request }) => {
    const user = getMockUser();

    if (!user) {
      return unauthorized();
    }

    if (user.role !== 'HOST' && user.role !== 'ADMIN') {
      return forbidden();
    }

    const room = mockRooms.find((item) => item.id === Number(params.roomId));
    const body = (await request.json()) as { status: HostRoomStatus };

    if (!room) {
      return HttpResponse.json(
        { code: 'ROOM_NOT_FOUND', message: '숙소를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    room.status = body.status;
    return HttpResponse.json(room);
  }),
];

function unauthorized() {
  return HttpResponse.json(
    { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' },
    { status: 401 },
  );
}

function forbidden() {
  return HttpResponse.json(
    { code: 'FORBIDDEN', message: '권한이 없습니다.' },
    { status: 403 },
  );
}
