package codesquad.airdnd.domain.wishlist.dto.response;

import codesquad.airdnd.domain.wishlist.entity.Wishlist;

public record WishlistPatchResponse(
        Long id,
        String name
) {

    public static WishlistPatchResponse from(Wishlist wishlist){
        return new WishlistPatchResponse(wishlist.getId(), wishlist.getName());
    }
}
