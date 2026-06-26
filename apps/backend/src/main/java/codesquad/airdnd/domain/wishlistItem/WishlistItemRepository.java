package codesquad.airdnd.domain.wishlistItem;

import codesquad.airdnd.domain.wishlistItem.dto.query.WishlistedListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.*;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, WishlistItemId> {

    @Query("""
        select count(wi) > 0 
        from WishlistItem wi
        where wi.wishlist.member.id = :memberId and wi.listing.id = :listingId
    """)
    boolean existsByMemberIdAndListingId(Long memberId, Long listingId);

    @Query("""
        select wi.wishlist.id
        from WishlistItem wi
        where wi.wishlist.member.id = :memberId and wi.listing.id = :listingId
    """)
    Long findWishlistId(Long memberId, Long listingId);

    Optional<WishlistItem> findByWishlist_IdAndListing_Id(Long wishlistId, Long listingId);

	@Query("""
      	select new codesquad.airdnd.domain.wishlistItem.dto.query.WishlistedListing(
	      	wi.listing.id, wi.wishlist.id)
      	from WishlistItem wi
        where wi.wishlist.member.id = :memberId and wi.listing.id in :listingIds
	""")
	List<WishlistedListing> findWishlistedPairs(Long memberId, Collection<Long> listingIds);
}
