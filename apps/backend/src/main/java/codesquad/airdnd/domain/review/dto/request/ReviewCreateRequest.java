package codesquad.airdnd.domain.review.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ReviewCreateRequest(
	@Min(value = 1, message = "별점은 1점 이상이어야 합니다.")
	@Max(value = 5, message = "별점은 5점 이하여야 합니다.")
	int rating,

	@Size(max = 1000, message = "리뷰 내용은 1000자 이하여야 합니다.")
	String content
) {
}
