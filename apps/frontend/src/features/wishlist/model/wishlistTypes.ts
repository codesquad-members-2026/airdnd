import { z } from 'zod';
import { roomDetailSchema } from '../../rooms/model/roomTypes';

export const wishlistSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  roomCount: z.number(),
});

export const wishlistListSchema = z.object({
  wishlists: z.array(wishlistSummarySchema),
});

export const wishlistDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  wishlistedRooms: z.array(roomDetailSchema),
});

export type WishlistSummary = z.infer<typeof wishlistSummarySchema>;
export type WishlistList = z.infer<typeof wishlistListSchema>;
export type WishlistDetail = z.infer<typeof wishlistDetailSchema>;
