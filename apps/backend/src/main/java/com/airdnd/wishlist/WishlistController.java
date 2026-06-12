package com.airdnd.wishlist;

import com.airdnd.auth.AuthMemberPrincipal;
import com.airdnd.wishlist.dto.WishlistAddRoomRequest;
import com.airdnd.wishlist.dto.WishlistListResponse;
import com.airdnd.wishlist.dto.WishlistRequest;
import com.airdnd.wishlist.dto.WishlistResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

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
}
