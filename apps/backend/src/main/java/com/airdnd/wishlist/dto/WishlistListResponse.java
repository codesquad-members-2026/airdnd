package com.airdnd.wishlist.dto;

import com.airdnd.wishlist.Wishlist;

import java.util.List;
import java.util.Map;

public record WishlistListResponse(
        List<WishlistSummary> wishlists
) {
    // covers: 위시리스트 id → 표지 이미지 URL(없는 폴더는 키 자체가 빠져 coverImageUrl 이 null).
    public static WishlistListResponse of(List<Wishlist> wishlists, Map<Long, String> covers) {
        List<WishlistSummary> summaries = wishlists.stream()
                .map(wishlist -> WishlistSummary.from(wishlist, covers.get(wishlist.getId())))
                .toList();
        return new WishlistListResponse(summaries);
    }

    public record WishlistSummary(
            Long id,
            String name,
            int roomCount,
            String coverImageUrl
    ) {
        public static WishlistSummary from(Wishlist wishlist, String coverImageUrl) {
            return new WishlistSummary(
                    wishlist.getId(), wishlist.getName(), wishlist.getRooms().size(), coverImageUrl);
        }
    }
}
