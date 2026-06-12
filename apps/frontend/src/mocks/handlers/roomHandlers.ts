import { http, HttpResponse } from 'msw';
import { mockRooms, toRoomDetail } from '../fixtures/mockData';

export const roomHandlers = [
  http.get('/api/rooms', ({ request }) => {
    const url = new URL(request.url);
    const region = url.searchParams.get('region')?.trim();
    const guests = Number(url.searchParams.get('guests') ?? '0');
    const minPrice = Number(url.searchParams.get('minPrice') ?? '0');
    const maxPrice = Number(url.searchParams.get('maxPrice') ?? '0');
    const allowsPets = url.searchParams.get('allowsPets') === 'true';

    const rooms = mockRooms
      .filter((room) => room.status === 'ACTIVE')
      .filter((room) => (region ? room.region.includes(region) || room.address.includes(region) : true))
      .filter((room) => (guests > 0 ? room.maxGuests >= guests : true))
      .filter((room) => (minPrice > 0 ? room.pricePerNight >= minPrice : true))
      .filter((room) => (maxPrice > 0 ? room.pricePerNight <= maxPrice : true))
      .filter((room) => (allowsPets ? room.allowsPets : true));

    return HttpResponse.json(rooms);
  }),
  http.get('/api/rooms/:roomId', ({ params }) => {
    const roomId = Number(params.roomId);
    const room = mockRooms.find((item) => item.id === roomId && item.status === 'ACTIVE');

    if (!room) {
      return HttpResponse.json(
        { code: 'ROOM_NOT_FOUND', message: '숙소를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json(toRoomDetail(room));
  }),
  http.get('/api/rooms/:roomId/reviews/summary', ({ params }) => {
    const roomId = Number(params.roomId);
    
    // 더미 데이터 생성
    return HttpResponse.json({
      rating: 4.8,
      reviewCount: 125,
      accuracyRating: 4.9,
      cleanlinessRating: 4.7,
      checkInRating: 4.9,
      communicationRating: 4.8,
      locationRating: 4.6,
      valueRating: 4.5
    });
  }),
];
