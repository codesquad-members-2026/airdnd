package codesquad.airdnd.domain.wishlist.dto.response;

import java.util.List;

public record WishlistItemResponse(
        Long listingId,
        String listingName,
        Long pricePerNight,
        Float rating,
        String note,
        List<String> imageUrls
) {
}
