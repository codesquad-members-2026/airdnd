import { z } from 'zod';
import { cursorPageSchema } from '../../../shared/api/cursorPage';
import { roomSummarySchema } from '../../rooms/model/roomTypes';

export const wishlistSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  roomCount: z.number(),
  // 폴더 표지로 쓰는 첫 숙소 대표 이미지. 담긴 숙소가 없으면 빈 문자열/누락일 수 있다.
  coverImageUrl: z.string().nullish(),
});

export const wishlistListSchema = z.object({
  wishlists: z.array(wishlistSummarySchema),
});

// 폴더 메타(이름·담긴 수)만. 저장 숙소는 별도 커서 페이지로 점진 로딩한다(무한 스크롤).
export const wishlistDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  roomCount: z.number().int().nonnegative(),
});

// 폴더에 담긴 숙소 한 페이지. RoomCard 가 쓰는 RoomSummary 그대로(상세 DTO 불필요).
export const wishlistRoomsPageSchema = cursorPageSchema(roomSummarySchema);

// 현재 로그인 회원이 (어느 폴더든) 위시리스트에 담은 방 id 집합. 카드 하트의 "저장됨(빨강)" 표시에 사용.
export const savedRoomIdsSchema = z.object({
  roomIds: z.array(z.number()),
});

// 특정 방이 담겨 있는 위시리스트(폴더) id 목록. 팝오버의 폴더별 체크 표시·토글에 사용.
export const roomWishlistIdsSchema = z.object({
  wishlistIds: z.array(z.number()),
});

export type WishlistSummary = z.infer<typeof wishlistSummarySchema>;
export type WishlistList = z.infer<typeof wishlistListSchema>;
export type WishlistDetail = z.infer<typeof wishlistDetailSchema>;
export type WishlistRoomsPage = z.infer<typeof wishlistRoomsPageSchema>;
export type SavedRoomIds = z.infer<typeof savedRoomIdsSchema>;
export type RoomWishlistIds = z.infer<typeof roomWishlistIdsSchema>;
