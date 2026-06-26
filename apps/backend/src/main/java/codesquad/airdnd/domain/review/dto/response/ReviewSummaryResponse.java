package codesquad.airdnd.domain.review.dto.response;

import java.util.List;

import codesquad.airdnd.domain.review.entity.ListingReviewSummary;

public record ReviewSummaryResponse(
	Double averageRating,
	int reviewCount,
	List<RatingBucket> distribution
) {
	public static ReviewSummaryResponse from(ListingReviewSummary summary) {
		List<RatingBucket> distribution = List.of(
			new RatingBucket(5, summary.getRating5Count()),
			new RatingBucket(4, summary.getRating4Count()),
			new RatingBucket(3, summary.getRating3Count()),
			new RatingBucket(2, summary.getRating2Count()),
			new RatingBucket(1, summary.getRating1Count())
		);
		return new ReviewSummaryResponse(summary.getAverageRating(), summary.getReviewCount(), distribution);
	}

	public static ReviewSummaryResponse empty() {
		List<RatingBucket> distribution = List.of(
			new RatingBucket(5, 0),
			new RatingBucket(4, 0),
			new RatingBucket(3, 0),
			new RatingBucket(2, 0),
			new RatingBucket(1, 0)
		);
		return new ReviewSummaryResponse(null, 0, distribution);
	}
}
