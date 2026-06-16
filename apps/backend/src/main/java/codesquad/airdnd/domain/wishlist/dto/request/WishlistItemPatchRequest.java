package codesquad.airdnd.domain.wishlist.dto.request;

import jakarta.validation.constraints.Size;

public record WishlistItemPatchRequest(

        @Size(max = 250, message = "250 글자 이하로 제한됩니다.")
        String note
) {
}
