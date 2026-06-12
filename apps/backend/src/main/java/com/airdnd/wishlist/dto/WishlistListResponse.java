package com.airdnd.wishlist.dto;

import com.airdnd.wishlist.Wishlist;

import java.util.List;

public record WishlistListResponse(
        List<WishlistSummary> wishlists
) {
    public static WishlistListResponse of(List<Wishlist> wishlists) {
        List<WishlistSummary> summaries = wishlists.stream()
                .map(WishlistSummary::from)
                .toList();
        return new WishlistListResponse(summaries);
    }

    public record WishlistSummary(
            Long id,
            String name,
            int roomCount
    ) {
        public static WishlistSummary from(Wishlist wishlist) {
            return new WishlistSummary(wishlist.getId(), wishlist.getName(), wishlist.getRooms().size());
        }
    }
}
