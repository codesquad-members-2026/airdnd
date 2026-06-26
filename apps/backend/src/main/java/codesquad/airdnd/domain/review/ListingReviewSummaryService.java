package codesquad.airdnd.domain.review;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.review.dto.response.ReviewSummaryResponse;
import codesquad.airdnd.domain.review.entity.ListingReviewSummary;
import codesquad.airdnd.domain.review.repository.ListingReviewSummaryRepository;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ListingReviewSummaryService {

	private final ListingReviewSummaryRepository repository;

	/**
	 * 리뷰 작성 시 호출. 통계 행이 없으면 새로 만들어(앱 레벨 upsert) 점수를 반영한다.
	 */
	@Transactional
	public void addReview(Listing listing, int rating) {
		ListingReviewSummary summary = repository.findById(listing.getId())
			.orElseGet(() -> ListingReviewSummary.create(listing));
		summary.addRating(rating);
		repository.save(summary);
	}

	@Transactional
	public void changeReview(Long listingId, int oldRating, int newRating) {
		getSummary(listingId).changeRating(oldRating, newRating);
	}

	@Transactional
	public void removeReview(Long listingId, int rating) {
		getSummary(listingId).removeRating(rating);
	}

	@Transactional(readOnly = true)
	public ReviewSummaryResponse getDistribution(Long listingId) {
		return repository.findById(listingId)
			.map(ReviewSummaryResponse::from)
			.orElseGet(ReviewSummaryResponse::empty);
	}

	private ListingReviewSummary getSummary(Long listingId) {
		return repository.findById(listingId)
			.orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_REVIEW_SUMMARY));
	}
}
