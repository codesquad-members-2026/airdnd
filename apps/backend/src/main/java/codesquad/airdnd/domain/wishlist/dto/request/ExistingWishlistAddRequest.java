package codesquad.airdnd.domain.wishlist.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ExistingWishlistAddRequest(

        @NotNull(message = "리스팅 id는 필수입니다.")
        @Min(value = 1, message = "최소 1 이상의 값이어야 합니다.")
        Long listingId
){
}
