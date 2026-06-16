package codesquad.airdnd.domain.wishlist.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WishlistPatchRequest(

        @NotBlank(message = "위시리스트의 이름은 한 글자 이상 채워져있어야 합니다.")
        @Size(max = 50, message = "50 글자 이하로 제한됩니다.")
        String name
) {
}
