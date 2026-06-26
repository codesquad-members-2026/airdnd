package codesquad.airdnd.domain.review;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import codesquad.airdnd.domain.review.dto.request.ReviewCreateRequest;
import codesquad.airdnd.domain.review.dto.request.ReviewCursorRequest;
import codesquad.airdnd.domain.review.dto.response.ReviewCreatedResponse;
import codesquad.airdnd.domain.review.dto.response.ReviewResponse;
import codesquad.airdnd.domain.review.dto.response.ReviewSummaryResponse;
import codesquad.airdnd.global.auth.CurrentMember;
import codesquad.airdnd.global.auth.CurrentMemberInfo;
import codesquad.airdnd.global.response.ApiResponse;
import codesquad.airdnd.global.response.CursorPageResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ReviewController {

	private final ReviewService reviewService;
	private final ListingReviewSummaryService summaryService;

	@Operation(summary = "게스트 리뷰 작성")
	@PostMapping("/reservations/{reservationId}/reviews")
	public ResponseEntity<ApiResponse<ReviewCreatedResponse>> createReview(
		@CurrentMember CurrentMemberInfo guest, @PathVariable Long reservationId,
		@RequestBody @Valid ReviewCreateRequest request
	) {
		Long reviewId = reviewService.create(guest.id(), reservationId, request.rating(), request.content());
		return ResponseEntity.status(HttpStatus.CREATED)
			.body(ApiResponse.success(ReviewCreatedResponse.from(reviewId)));
	}

	@Operation(summary = "숙소 별점 분포 (1~5점 개수)")
	@GetMapping("/listings/{listingId}/review-summary")
	public ApiResponse<ReviewSummaryResponse> getReviewSummary(@PathVariable Long listingId) {
		return ApiResponse.success(summaryService.getDistribution(listingId));
	}

	@Operation(summary = "숙소 리뷰 목록 (커서 페이징)")
	@GetMapping("/listings/{listingId}/reviews")
	public ApiResponse<CursorPageResponse<ReviewResponse>> getReviews(
		@PathVariable Long listingId, @ModelAttribute @Valid ReviewCursorRequest request
	) {
		return ApiResponse.success(reviewService.getReviews(listingId, request));
	}

	@Operation(summary = "게스트 리뷰 삭제")
	@DeleteMapping("/reviews/{reviewId}")
	public ResponseEntity<ApiResponse<Void>> deleteReview(
		@CurrentMember CurrentMemberInfo guest, @PathVariable Long reviewId
	) {
		reviewService.delete(guest.id(), reviewId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
