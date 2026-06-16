package codesquad.airdnd.domain.wishlist.dto.response;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.wishlist.entity.Wishlist;

public record ExistingWishlistAddResponse(
        Long wishlistId,
        Long listingId,
        String name
) {

    public static ExistingWishlistAddResponse of(Wishlist wishlist, Listing listing) {
        return new ExistingWishlistAddResponse(wishlist.getId(), listing.getId(), wishlist.getName());
    }
}
