package codesquad.airdnd.domain.wishlistItem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, WishlistItemId> {

    @Query("""
        select count(wi) > 0 
        from WishlistItem wi
        where wi.wishlist.member.id = :memberId and wi.listing.id = :listingId
    """)
    boolean existsByMemberIdAndListingId(Long memberId, Long listingId);

    Optional<WishlistItem> findByWishlist_IdAndListing_Id(Long wishlistId, Long listingId);
}
