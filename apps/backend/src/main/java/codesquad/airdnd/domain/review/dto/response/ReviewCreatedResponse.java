package codesquad.airdnd.domain.review.dto.response;

public record ReviewCreatedResponse(
	Long reviewId
) {
	public static ReviewCreatedResponse from(Long reviewId) {
		return new ReviewCreatedResponse(reviewId);
	}
}
