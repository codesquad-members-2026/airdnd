package codesquad.airdnd.domain.wishlist.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NewWishlistAddRequest(

        @NotNull(message = "리스팅 id는 필수입니다.")
        @Min(value = 1, message = "최소 1 이상의 값이어야 합니다.")
        Long listingId,

        @NotBlank(message = "위시리스트의 이름은 한 글자 이상 채워져있어야 합니다.")
        @Size(max = 50)
        String name
) {
}