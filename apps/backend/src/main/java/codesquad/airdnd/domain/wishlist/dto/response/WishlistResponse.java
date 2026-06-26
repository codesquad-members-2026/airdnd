package codesquad.airdnd.domain.wishlist.dto.response;

public record WishlistResponse(
        Long id,
        String name,
        Long itemCount,
        String imgUrl
) {}
