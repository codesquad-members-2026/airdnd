package com.airdnd.wishlist;

import com.airdnd.wishlist.dto.WishlistRoomRow;

import java.util.List;
import java.util.Map;

public interface WishlistRoomQueryRepository {

    List<WishlistRoomRow> findRoomPage(Long wishlistId, Long cursorId, int limit);

    // 회원의 각 위시리스트 → 표지 이미지 URL. 폴더마다 가장 먼저 담은 숙소의 대표 이미지를 쓴다.
    // 대표 이미지가 없는 폴더는 키 자체가 빠진다(프론트가 플레이스홀더로 처리).
    Map<Long, String> findCoverImageUrlsByMemberId(Long memberId);
}
