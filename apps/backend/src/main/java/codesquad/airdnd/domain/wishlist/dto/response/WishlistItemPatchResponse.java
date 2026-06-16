package codesquad.airdnd.domain.wishlist.dto.response;

import codesquad.airdnd.domain.wishlistItem.WishlistItem;

public record WishlistItemPatchResponse(
        Long wishlistId,
        Long listingId,
        String note
) {

    public static WishlistItemPatchResponse from(WishlistItem wishlistItem) {
        return new WishlistItemPatchResponse(
                wishlistItem.getId().getWishlistId(),
                wishlistItem.getId().getListingId(),
                wishlistItem.getNote());
    }
}
