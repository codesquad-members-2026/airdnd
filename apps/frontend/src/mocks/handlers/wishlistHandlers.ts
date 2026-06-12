import { http, HttpResponse } from 'msw';
import { mockRooms, mockWishlists } from '../fixtures/mockData';
import { getMockUser } from './authHandlers';

export const wishlistHandlers = [
  http.get('/api/wishlist', () => {
    if (!getMockUser()) {
      return unauthorized();
    }

    return HttpResponse.json({
      wishlists: mockWishlists.map((wishlist) => ({
        id: wishlist.id,
        name: wishlist.name,
        roomCount: wishlist.rooms.length,
      })),
    });
  }),
  http.post('/api/wishlist', async ({ request }) => {
    if (!getMockUser()) {
      return unauthorized();
    }

    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim();

    if (!name) {
      return HttpResponse.json(
        { code: 'VALIDATION_FAILED', message: '위시리스트 이름을 입력해 주세요.' },
        { status: 400 },
      );
    }

    if (mockWishlists.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      return HttpResponse.json(
        { code: 'WISHLIST_ALREADY_EXISTS', message: '이미 같은 위시리스트가 존재합니다.' },
        { status: 409 },
      );
    }

    const newWishlist = { id: Date.now(), name, rooms: [] as (typeof mockWishlists)[number]['rooms'] };
    mockWishlists.push(newWishlist);

    return HttpResponse.json(
      { id: newWishlist.id, name: newWishlist.name, wishlistedRooms: [] },
      { status: 201 },
    );
  }),
  http.get('/api/wishlist/:wishlistId', ({ params }) => {
    if (!getMockUser()) {
      return unauthorized();
    }

    const wishlist = mockWishlists.find((item) => item.id === Number(params.wishlistId));

    if (!wishlist) {
      return HttpResponse.json(
        { code: 'WISHLIST_NOT_FOUND', message: '요청하신 위시리스트가 존재하지 않습니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      id: wishlist.id,
      name: wishlist.name,
      wishlistedRooms: wishlist.rooms,
    });
  }),
  http.post('/api/wishlist/:wishlistId/rooms', async ({ params, request }) => {
    if (!getMockUser()) {
      return unauthorized();
    }

    const wishlist = mockWishlists.find((item) => item.id === Number(params.wishlistId));

    if (!wishlist) {
      return HttpResponse.json(
        { code: 'WISHLIST_NOT_FOUND', message: '요청하신 위시리스트가 존재하지 않습니다.' },
        { status: 404 },
      );
    }

    const body = (await request.json()) as { roomId: number };
    const room = mockRooms.find((item) => item.id === body.roomId);

    if (!room) {
      return HttpResponse.json(
        { code: 'ROOM_NOT_FOUND', message: '요청하신 숙소 정보를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    if (wishlist.rooms.some((item) => item.id === room.id)) {
      return HttpResponse.json(
        { code: 'WISHLIST_ROOM_ALREADY_EXISTS', message: '이미 같은 숙소가 위시리스트 내에 존재합니다.' },
        { status: 409 },
      );
    }

    wishlist.rooms.push(room);
    return new HttpResponse(null, { status: 204 });
  }),
];

function unauthorized() {
  return HttpResponse.json(
    { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' },
    { status: 401 },
  );
}
