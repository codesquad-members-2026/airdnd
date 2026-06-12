package com.airdnd.wishlist.dto;

import com.airdnd.room.dto.RoomDetailResponse;
import com.airdnd.wishlist.Wishlist;
import com.airdnd.wishlist.WishlistRoom;

import java.util.List;

public record WishlistResponse(
        Long id,
        String name,
        List<RoomDetailResponse> wishlistedRooms
) {
    public static WishlistResponse from(Wishlist wishlist) {
        List<RoomDetailResponse> rooms = wishlist.getRooms().stream()
                .map(WishlistRoom::getRoom)
                .map(RoomDetailResponse::from)
                .toList();
        return new WishlistResponse(wishlist.getId(), wishlist.getName(), rooms);
    }
}
