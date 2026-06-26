package codesquad.airdnd.domain.review.dto.response;

import java.time.LocalDateTime;

import codesquad.airdnd.domain.review.entity.Review;

public record ReviewResponse(
	Long reviewId,
	ReviewerInfo author,
	int rating,
	String content,
	LocalDateTime createdAt
) {
	public static ReviewResponse from(Review review) {
		return new ReviewResponse(
			review.getId(),
			ReviewerInfo.from(review.getAuthor()),
			review.getRating(),
			review.getContent(),
			review.getCreatedAt()
		);
	}
}
