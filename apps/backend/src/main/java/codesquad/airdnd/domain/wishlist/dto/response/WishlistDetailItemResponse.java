package codesquad.airdnd.domain.wishlist.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record WishlistDetailItemResponse(
        Long listingId,
        String listingName,
        BigDecimal pricePerNight,
        // TODO: rating 추후 추가
        String note,
        List<String> imageUrls
) {}
