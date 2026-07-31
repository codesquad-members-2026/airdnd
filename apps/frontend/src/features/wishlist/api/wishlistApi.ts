import { request } from '../../../shared/api/httpClient';
import { withRating } from '../../rooms/api/roomsApi';
import {
  RoomWishlistIds,
  SavedRoomIds,
  WishlistDetail,
  WishlistList,
  WishlistRoomsPage,
  roomWishlistIdsSchema,
  savedRoomIdsSchema,
  wishlistDetailSchema,
  wishlistListSchema,
  wishlistRoomsPageSchema,
} from '../model/wishlistTypes';

export async function getWishlists() {
  const data = await request<WishlistList>('/api/wishlist');
  return wishlistListSchema.parse(data).wishlists;
}

// 폴더 메타(이름·담긴 수)만. 저장 숙소는 getWishlistRooms 로 따로 페이지 단위로 받는다.
export async function getWishlist(wishlistId: number) {
  const data = await request<WishlistDetail>(`/api/wishlist/${wishlistId}`);
  return wishlistDetailSchema.parse(data);
}

// 폴더에 담긴 숙소를 커서 페이지(무한 스크롤)로 조회. RoomSummary 라 평점 키(averageRating→rating)를 맞춰준다.
export async function getWishlistRooms(
  wishlistId: number,
  cursor?: string,
): Promise<WishlistRoomsPage> {
  const query = new URLSearchParams();
  if (cursor) query.set('cursor', cursor);
  const qs = query.toString();
  const data = await request<unknown>(`/api/wishlist/${wishlistId}/rooms${qs ? `?${qs}` : ''}`);
  const page = (data ?? {}) as { items?: unknown };
  const normalized =
    Array.isArray(page.items) ? { ...page, items: page.items.map(withRating) } : data;
  return wishlistRoomsPageSchema.parse(normalized);
}

export async function getSavedRoomIds() {
  const data = await request<SavedRoomIds>('/api/wishlist/saved-room-ids');
  return savedRoomIdsSchema.parse(data).roomIds;
}

// 이 방이 담겨 있는 위시리스트(폴더) id 목록. 팝오버 폴더별 체크 표시용.
export async function getWishlistIdsForRoom(roomId: number) {
  const data = await request<RoomWishlistIds>(`/api/wishlist/rooms/${roomId}/wishlist-ids`);
  return roomWishlistIdsSchema.parse(data).wishlistIds;
}

export async function addRoomToWishlist(wishlistId: number, roomId: number) {
  await request<void>(`/api/wishlist/${wishlistId}/rooms`, {
    method: 'POST',
    body: { roomId },
  });
}

export async function createWishlist(name: string) {
  await request<void>('/api/wishlist', {
    method: 'POST',
    body: { name },
  });
}

// 특정 폴더에서만 방 제거(폴더별 토글 해제). 멱등(없어도 204).
export async function removeRoomFromWishlistFolder(wishlistId: number, roomId: number) {
  await request<void>(`/api/wishlist/${wishlistId}/rooms/${roomId}`, {
    method: 'DELETE',
  });
}
