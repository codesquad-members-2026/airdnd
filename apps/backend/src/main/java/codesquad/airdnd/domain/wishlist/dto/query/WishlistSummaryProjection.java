package codesquad.airdnd.domain.wishlist.dto.query;

public interface WishlistSummaryProjection {
    Long getId();
    String getName();
    Long getItemCount();
    Long getCoverListingId();
}
