package codesquad.airdnd.domain.review;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.review.dto.response.RatingBucket;
import codesquad.airdnd.domain.review.dto.response.ReviewSummaryResponse;
import codesquad.airdnd.domain.review.entity.ListingReviewSummary;
import codesquad.airdnd.domain.review.repository.ListingReviewSummaryRepository;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class ListingReviewSummaryServiceTest {

	private static final Long LISTING_ID = 1L;

	@Mock
	private ListingReviewSummaryRepository repository;

	@InjectMocks
	private ListingReviewSummaryService service;

	@Mock
	private Listing listing;

	@Nested
	@DisplayName("리뷰 추가 (addReview)")
	class Add {

		@Test
		@DisplayName("통계 행이 없으면 새로 만들어 점수를 반영한다")
		void createsWhenAbsent() {
			given(listing.getId()).willReturn(LISTING_ID);
			given(repository.findById(LISTING_ID)).willReturn(Optional.empty());

			service.addReview(listing, 5);

			ArgumentCaptor<ListingReviewSummary> captor = ArgumentCaptor.forClass(ListingReviewSummary.class);
			then(repository).should().save(captor.capture());
			assertThat(captor.getValue().getReviewCount()).isEqualTo(1);
			assertThat(captor.getValue().getAverageRating()).isEqualTo(5.0);
		}

		@Test
		@DisplayName("통계 행이 있으면 기존 통계에 점수를 누적한다")
		void accumulatesWhenPresent() {
			given(listing.getId()).willReturn(LISTING_ID);
			ListingReviewSummary existing = ListingReviewSummary.create(listing);
			existing.addRating(3);
			given(repository.findById(LISTING_ID)).willReturn(Optional.of(existing));

			service.addReview(listing, 5);

			assertThat(existing.getReviewCount()).isEqualTo(2);
			assertThat(existing.getAverageRating()).isEqualTo(4.0);
		}
	}

	@Nested
	@DisplayName("리뷰 수정 (changeReview)")
	class Change {

		@Test
		@DisplayName("개수는 유지하고 점수만 옮긴다")
		void movesRating() {
			ListingReviewSummary existing = ListingReviewSummary.create(listing);
			existing.addRating(2);
			given(repository.findById(LISTING_ID)).willReturn(Optional.of(existing));

			service.changeReview(LISTING_ID, 2, 5);

			assertThat(existing.getReviewCount()).isEqualTo(1);
			assertThat(existing.getAverageRating()).isEqualTo(5.0);
		}

		@Test
		@DisplayName("통계 행이 없으면 예외다")
		void throwsWhenAbsent() {
			given(repository.findById(LISTING_ID)).willReturn(Optional.empty());

			assertThatThrownBy(() -> service.changeReview(LISTING_ID, 2, 5))
				.isInstanceOf(BusinessException.class)
				.hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FOUND_REVIEW_SUMMARY);
		}
	}

	@Nested
	@DisplayName("리뷰 삭제 (removeReview)")
	class Remove {

		@Test
		@DisplayName("해당 점수를 차감한다")
		void decrements() {
			ListingReviewSummary existing = ListingReviewSummary.create(listing);
			existing.addRating(4);
			existing.addRating(2);
			given(repository.findById(LISTING_ID)).willReturn(Optional.of(existing));

			service.removeReview(LISTING_ID, 2);

			assertThat(existing.getReviewCount()).isEqualTo(1);
			assertThat(existing.getAverageRating()).isEqualTo(4.0);
		}
	}

	@Nested
	@DisplayName("별점 분포 (getDistribution)")
	class GetDistribution {

		@Test
		@DisplayName("통계가 있으면 평균·총개수와 5→1점 버킷을 반환한다")
		void returnsDistribution() {
			ListingReviewSummary summary = ListingReviewSummary.create(listing);
			summary.addRating(5);
			summary.addRating(5);
			summary.addRating(3);
			given(repository.findById(LISTING_ID)).willReturn(Optional.of(summary));

			ReviewSummaryResponse result = service.getDistribution(LISTING_ID);

			assertThat(result.reviewCount()).isEqualTo(3);
			assertThat(result.averageRating()).isEqualTo((5 + 5 + 3) / 3.0);
			assertThat(result.distribution()).extracting(RatingBucket::rating).containsExactly(5, 4, 3, 2, 1);
			assertThat(result.distribution().get(0).count()).isEqualTo(2); // 5점
			assertThat(result.distribution().get(2).count()).isEqualTo(1); // 3점
		}

		@Test
		@DisplayName("통계가 없으면 평균 null·총개수 0·모든 버킷 0을 반환한다")
		void returnsEmptyWhenAbsent() {
			given(repository.findById(LISTING_ID)).willReturn(Optional.empty());

			ReviewSummaryResponse result = service.getDistribution(LISTING_ID);

			assertThat(result.reviewCount()).isZero();
			assertThat(result.averageRating()).isNull();
			assertThat(result.distribution()).extracting(RatingBucket::rating).containsExactly(5, 4, 3, 2, 1);
			assertThat(result.distribution()).allSatisfy(b -> assertThat(b.count()).isZero());
		}
	}
}
