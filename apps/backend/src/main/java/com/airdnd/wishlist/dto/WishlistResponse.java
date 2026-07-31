package com.airdnd.wishlist.dto;

import com.airdnd.wishlist.Wishlist;

// 폴더 메타(이름·담긴 수)만. 저장 숙소는 GET /api/wishlist/{id}/rooms 커서 페이지로 따로 내려준다.
// (전체 rooms 를 한 번에 적재하던 기존 응답이 상세 페이지 무한 스크롤의 원인이라 분리했다.)
public record WishlistResponse(
        Long id,
        String name,
        int roomCount
) {
    public static WishlistResponse of(Wishlist wishlist, long roomCount) {
        return new WishlistResponse(wishlist.getId(), wishlist.getName(), (int) roomCount);
    }
}
