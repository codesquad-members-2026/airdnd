package com.airdnd.wishlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    @Query("""
            select distinct w
            from Wishlist w
            left join fetch w.rooms wr
            left join fetch wr.room
            where w.memberId = :memberId
            order by w.createdAt desc
            """)
    List<Wishlist> findAllWithRoomsByMemberId(@Param("memberId") Long memberId);

    boolean existsWishlistByMemberIdAndNameIgnoreCase(Long memberId,String name);
}
