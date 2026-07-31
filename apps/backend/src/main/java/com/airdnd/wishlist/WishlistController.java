package com.airdnd.wishlist;

import com.airdnd.auth.AuthMemberPrincipal;
import com.airdnd.room.dto.CursorPage;
import com.airdnd.room.dto.RoomSummary;
import com.airdnd.wishlist.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService service;

    @GetMapping
    public ResponseEntity<WishlistListResponse> getAllWishLists(@AuthenticationPrincipal AuthMemberPrincipal principal) {
        return ResponseEntity.ok(service.getAllWishListsByMemberId(principal.getMemberId()));
    }

    @GetMapping("/{wishlistId}")
    public ResponseEntity<WishlistResponse> getWishlistByWishlistId(
            @AuthenticationPrincipal AuthMemberPrincipal principal,
            @PathVariable Long wishlistId) {
        return ResponseEntity.ok(service.getWishListByWishListId(principal.getMemberId(), wishlistId));
    }

    @GetMapping("/{wishlistId}/rooms")
    public ResponseEntity<CursorPage<RoomSummary>> getWishlistRooms(
            @AuthenticationPrincipal AuthMemberPrincipal principal,
            @PathVariable Long wishlistId,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.getWishlistRooms(principal.getMemberId(), wishlistId, cursor, size));
    }

    @PostMapping
    public ResponseEntity<WishlistResponse> createNewWishlist(@AuthenticationPrincipal AuthMemberPrincipal principal, @RequestBody WishlistRequest request){
        service.createNewWishlist(principal.getMemberId(), request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{wishlistId}/rooms")
    public ResponseEntity<Void> addRoomToWishlist(@AuthenticationPrincipal AuthMemberPrincipal principal,@PathVariable Long wishlistId , @RequestBody WishlistAddRoomRequest request){
        service.addRoomToWishlist(principal.getMemberId(), wishlistId, request.roomId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/saved-room-ids")
    public ResponseEntity<SavedRoomIdsResponse> getSavedRoomIds(@AuthenticationPrincipal AuthMemberPrincipal principal){
        return ResponseEntity.ok(service.getSavedRoomIds(principal.getMemberId()));
    }

    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> removeRoomFromWishlist(
            @AuthenticationPrincipal AuthMemberPrincipal principal,
            @PathVariable Long roomId) {
        service.removeRoomFromWishlists(principal.getMemberId(), roomId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/rooms/{roomId}/wishlist-ids")
    public ResponseEntity<RoomWishlistIdsResponse> getWishlistIdsForRoom(
            @AuthenticationPrincipal AuthMemberPrincipal principal,
            @PathVariable Long roomId) {
        return ResponseEntity.ok(service.getWishlistIdsForRoom(principal.getMemberId(), roomId));
    }

    @DeleteMapping("/{wishlistId}/rooms/{roomId}")
    public ResponseEntity<Void> removeRoomFromFolder(
            @AuthenticationPrincipal AuthMemberPrincipal principal,
            @PathVariable Long wishlistId,
            @PathVariable Long roomId) {
        service.removeRoomFromFolder(principal.getMemberId(), wishlistId, roomId);
        return ResponseEntity.noContent().build();
    }

}
