package codesquad.airdnd.domain.wishlist.dto.response;

import java.util.List;

public record WishlistDetailResponse(
        Long id,
        String name,
        List<WishlistDetailItemResponse> items
) {
}
