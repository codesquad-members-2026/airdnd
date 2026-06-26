package codesquad.airdnd.domain.wishlistItem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, WishlistItemId> {

    @Query("""
        select count(wi) > 0 
        from WishlistItem wi
        where wi.wishlist.member.id = :memberId and wi.listing.id = :listingId
    """)
    boolean existsByMemberIdAndListingId(Long memberId, Long listingId);

    Optional<WishlistItem> findByWishlist_IdAndListing_Id(Long wishlistId, Long listingId);

	@Query("""
      	select wi.listing.id
     	from WishlistItem wi
    	where wi.wishlist.member.id = :memberId and wi.listing.id in :listingIds
	""")
	Set<Long> findWishlistedListingIds(Long memberId, Collection<Long> listingIds);
}
