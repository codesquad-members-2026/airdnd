package com.airdnd.wishlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WishlistRoomRepository extends JpaRepository<WishlistRoom, Long>, WishlistRoomQueryRepository {

    @Query("select distinct wr.room.id from WishlistRoom wr where wr.wishlist.memberId = :memberId")
    List<Long> findRoomIdsByMemberId(@Param("memberId") Long memberId);

    long countByWishlistId(Long wishlistId);

    @Modifying
    @Query("delete from WishlistRoom wr where wr.room.id = :roomId and wr.wishlist.id in " +
            "(select w.id from Wishlist w where w.memberId = :memberId)")
    int deleteByRoomIdAndMemberId(@Param("roomId") Long roomId, @Param("memberId") Long memberId);

    @Query("select wr.wishlist.id from WishlistRoom wr where wr.room.id = :roomId and wr.wishlist.memberId = :memberId")
    List<Long> findWishlistIdsByRoomIdAndMemberId(@Param("roomId") Long roomId, @Param("memberId") Long memberId);

    @Modifying
    @Query("delete from WishlistRoom wr where wr.wishlist.id = :wishlistId and wr.room.id = :roomId")
    int deleteByWishlistIdAndRoomId(@Param("wishlistId") Long wishlistId, @Param("roomId") Long roomId);
}
