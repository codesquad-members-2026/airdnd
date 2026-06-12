import { request } from '../../../shared/api/httpClient';
import {
  WishlistDetail,
  WishlistList,
  wishlistDetailSchema,
  wishlistListSchema,
} from '../model/wishlistTypes';

export async function getWishlists() {
  const data = await request<WishlistList>('/api/wishlist');
  return wishlistListSchema.parse(data).wishlists;
}

export async function getWishlist(wishlistId: number) {
  const data = await request<WishlistDetail>(`/api/wishlist/${wishlistId}`);
  return wishlistDetailSchema.parse(data);
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
