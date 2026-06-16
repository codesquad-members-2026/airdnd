package codesquad.airdnd.domain.wishlist.dto.query;

import java.math.BigDecimal;

public record WishlistDetailItemQueryResult(
        Long listingId,
        String listingName,
        BigDecimal pricePerNight,
        // TODO: 추후 rating 관련 컬럼 추가
        String imageUrl
) {
}
