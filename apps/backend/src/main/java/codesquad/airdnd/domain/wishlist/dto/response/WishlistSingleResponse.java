package codesquad.airdnd.domain.wishlist.dto.response;

import java.util.List;

public record WishlistSingleResponse(
        Long id,
        String name,
        List<WishlistItemResponse> items
) {
}
