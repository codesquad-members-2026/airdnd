package com.airdnd.wishlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WishlistRoomRepository extends JpaRepository<WishlistRoom, Long> {
}
