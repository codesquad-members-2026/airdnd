package codesquad.airdnd.domain.wishlist;

import codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailItemQueryResult;
import codesquad.airdnd.domain.wishlist.entity.Wishlist;
import codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailQueryResult;
import codesquad.airdnd.domain.wishlist.dto.response.WishlistResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    // TODO: 한방 쿼리 -> 분할 쿼리로 개선 필요 + 메서드명도 더 간결하게 변경 -> findByMember
    @Query(value = """
        WITH latest_item AS (
                SELECT wishlist_id, listing_id
                FROM (
                    SELECT
                        wishlist_id,
                        listing_id,
                        ROW_NUMBER() OVER (PARTITION BY wishlist_id ORDER BY created_at DESC) AS rn
                    FROM wishlist_item
                    WHERE wishlist_id IN (SELECT id FROM wishlist WHERE member_id = :memberId)
                ) ranked
                WHERE ranked.rn = 1
            ),
            best_image AS (
                SELECT listing_id, image_url
                FROM (
                    SELECT
                        listing_id, 
                        image_url,
                        ROW_NUMBER() OVER (PARTITION BY listing_id ORDER BY sort_order ASC) AS rn
                    FROM listing_image
                ) ranked
                WHERE ranked.rn = 1
            )
            SELECT
                w.id,
                w.name,
                COUNT(wi.listing_id) AS itemCount,
                bi.image_url AS imgUrl
            FROM wishlist w
            LEFT JOIN wishlist_item wi ON wi.wishlist_id = w.id
            LEFT JOIN latest_item li ON li.wishlist_id = w.id
            LEFT JOIN best_image bi ON bi.listing_id = li.listing_id
            WHERE w.member_id = :memberId
            GROUP BY w.id, w.name, bi.image_url
        """, nativeQuery = true)
    List<WishlistResponse> findWishlistsByMember(@Param("memberId") Long memberId);

    @Query("""
        select new codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailQueryResult(
            w.id, w.name, wi.note, wi.listing.id
            )
                from Wishlist w
                left join WishlistItem wi on wi.wishlist = w
                where w.id = :wishlistId
                order by wi.createdAt desc
    """)
    List<WishlistDetailQueryResult> findDetail(@Param("wishlistId") Long wishlistId);

    @Query(
    """
        select new codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailItemQueryResult(
            l.id, l.name, l.pricePerNight, li.imageUrl
        )
                from Listing l
                left join ListingImage li on li.listing = l
                where l.id IN :listingIds
                order by l.id, li.sortOrder
    """
    )
    List<WishlistDetailItemQueryResult> findDetailItem(@Param("listingIds") List<Long> listingIds);

    Optional<Wishlist> findByIdAndMember_Id(Long wishlistId, Long memberId);
}
