package codesquad.airdnd.domain.wishlist.dto.query;

public record WishlistDetailQueryResult(
        Long id,
        String name,
        String note,
        Long listingId
) {}