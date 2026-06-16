package codesquad.airdnd.domain.wishlist.dto.response;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.wishlist.entity.Wishlist;

public record NewWishlistAddResponse(
        Long wishlistId,
        Long listingId,
        String name
) {

    public static NewWishlistAddResponse of(Wishlist wishlist, Listing listing) {
        return new NewWishlistAddResponse(wishlist.getId(), listing.getId(), wishlist.getName());
    }
}
