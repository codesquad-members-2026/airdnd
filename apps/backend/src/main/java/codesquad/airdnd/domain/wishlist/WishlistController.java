package codesquad.airdnd.domain.wishlist;

import codesquad.airdnd.domain.wishlist.dto.request.ExistingWishlistAddRequest;
import codesquad.airdnd.domain.wishlist.dto.request.NewWishlistAddRequest;
import codesquad.airdnd.domain.wishlist.dto.request.WishlistItemPatchRequest;
import codesquad.airdnd.domain.wishlist.dto.request.WishlistPatchRequest;
import codesquad.airdnd.domain.wishlist.dto.response.*;
import codesquad.airdnd.global.auth.CurrentMember;
import codesquad.airdnd.global.auth.CurrentMemberInfo;
import codesquad.airdnd.global.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ApiResponse<List<WishlistResponse>> getWishlists(@CurrentMember CurrentMemberInfo member){
        return ApiResponse.success(wishlistService.getWishlists(member.id()));
    }

    @GetMapping("/{wishlistId}")
    public ApiResponse<WishlistDetailResponse> getWishlistDetail(
            @PathVariable @Min(1) Long wishlistId){
        return ApiResponse.success(wishlistService.getWishlist(wishlistId));
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<NewWishlistAddResponse> addItemInNewWishlist(
            @CurrentMember CurrentMemberInfo member,
            @RequestBody @Valid NewWishlistAddRequest request
    ){
        return ApiResponse.success(wishlistService.addItemInNewWishlist(member.id(), request));
    }

    // TODO: ConstraintViolationException 전역 에러 처리 필요 (Validated)
    @PostMapping("/{wishlistId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ExistingWishlistAddResponse> addItemInExistingWishlist(
            @CurrentMember CurrentMemberInfo member,
            @PathVariable @Min(value = 1, message = "최소 1 이상의 값이어야 합니다.") Long wishlistId,
            @RequestBody @Valid ExistingWishlistAddRequest request
    ){
        return ApiResponse.success(wishlistService.addItemInExistingWishlist(member.id(), wishlistId, request));
    }

    @DeleteMapping("/{wishlistId}")
    public ApiResponse<Void> deleteWishlist(
            @CurrentMember CurrentMemberInfo member,
            @PathVariable @Min(1) Long wishlistId){
        wishlistService.deleteWishlist(member.id(), wishlistId);
        return ApiResponse.success();
    }

    @DeleteMapping("/{wishlistId}/items/{listingId}")
    public ApiResponse<Void> deleteItemInWishlist(
            @CurrentMember CurrentMemberInfo member,
            @PathVariable @Min(1) Long wishlistId,
            @PathVariable @Min(1) Long listingId
    ){
        wishlistService.deleteItemInWishlist(member.id(), wishlistId, listingId);
        return ApiResponse.success();
    }

    @PatchMapping("/{wishlistId}")
    public ApiResponse<WishlistPatchResponse> patchWishlist(
            @CurrentMember CurrentMemberInfo member,
            @PathVariable @Min(1) Long wishlistId,
            @RequestBody @Valid WishlistPatchRequest request
    ){
        return ApiResponse.success(wishlistService.patchWishlist(member.id(), wishlistId, request));
    }

    @PatchMapping("/{wishlistId}/items/{listingId}")
    public ApiResponse<WishlistItemPatchResponse> patchItemInWishlist(
            @CurrentMember CurrentMemberInfo member,
            @PathVariable @Min(1) Long wishlistId,
            @PathVariable @Min(1) Long listingId,
            @RequestBody @Valid WishlistItemPatchRequest request
    ){
        return ApiResponse.success(wishlistService.patchItemInWishlist(member.id(), wishlistId, listingId, request));
    }
}
