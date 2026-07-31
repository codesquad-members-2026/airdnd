package com.airdnd.wishlist.dto;

import com.airdnd.room.dto.RoomSummary;

// 폴더에 담긴 숙소 한 행. 커서(keyset) 페이지네이션 키가 wishlist_rooms.id 이므로
// 카드용 RoomSummary 와 함께 그 행 id 를 같이 실어, nextCursor 계산에 쓴다.
public record WishlistRoomRow(
        Long wishlistRoomId,
        RoomSummary room
) {
}
