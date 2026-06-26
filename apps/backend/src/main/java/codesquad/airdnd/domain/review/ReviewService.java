package codesquad.airdnd.domain.review;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import org.springframework.data.domain.Limit;

import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.domain.reservation.ReservationRepository;
import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.domain.review.dto.request.ReviewCursorRequest;
import codesquad.airdnd.domain.review.dto.response.ReviewResponse;
import codesquad.airdnd.domain.review.entity.Review;
import codesquad.airdnd.domain.review.repository.ReviewRepository;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import codesquad.airdnd.global.response.CursorPageResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {

	private final ReviewRepository reviewRepository;
	private final ReservationRepository reservationRepository;
	private final MemberRepository memberRepository;
	private final ListingReviewSummaryService summaryService;

	@Transactional
	public Long create(Long memberId, Long reservationId, int rating, String content) {
		Reservation reservation = reservationRepository.findById(reservationId)
			.orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

		if (reviewRepository.existsByReservation_ReservationId(reservationId)) {
			throw new BusinessException(ErrorCode.DUPLICATE_REVIEW);
		}

		Member author = memberRepository.getReferenceById(memberId);
		Review review = Review.create(reservation, author, rating, content);
		reviewRepository.save(review);

		summaryService.addReview(reservation.getListing(), rating);
		return review.getId();
	}

	@Transactional
	public void delete(Long memberId, Long reviewId) {
		Review review = reviewRepository.findById(reviewId)
			.orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));

		if (!review.isWrittenBy(memberId)) {
			throw new BusinessException(ErrorCode.REVIEW_NOT_AUTHOR);
		}

		reviewRepository.delete(review);
		summaryService.removeReview(review.getListingId(), review.getRating());
	}

	@Transactional(readOnly = true)
	public CursorPageResponse<ReviewResponse> getReviews(Long listingId, ReviewCursorRequest request) {
		int size = request.sizeOrDefault();
		List<Review> rows = reviewRepository.findByReservation_Listing_IdAndIdLessThanOrderByIdDesc(
			listingId, request.cursorOrMax(), Limit.of(size + 1));

		boolean hasNext = rows.size() > size;
		List<Review> page = hasNext ? rows.subList(0, size) : rows;

		List<ReviewResponse> content = page.stream().map(ReviewResponse::from).toList();
		Long nextCursor = page.isEmpty() ? null : page.get(page.size() - 1).getId();

		return CursorPageResponse.of(content, nextCursor, hasNext);
	}
}
