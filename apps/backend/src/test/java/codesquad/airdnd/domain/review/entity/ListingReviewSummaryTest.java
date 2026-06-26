package codesquad.airdnd.domain.review.entity;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;

class ListingReviewSummaryTest {

	private final Listing listing = mock(Listing.class);

	private ListingReviewSummary summary() {
		return ListingReviewSummary.create(listing);
	}

	@Nested
	@DisplayName("생성")
	class Creation {

		@Test
		@DisplayName("새로 생성된 통계는 리뷰 0건, 평균 null이다")
		void initialIsEmpty() {
			ListingReviewSummary summary = summary();

			assertThat(summary.getReviewCount()).isZero();
			assertThat(summary.getAverageRating()).isNull();
		}
	}

	@Nested
	@DisplayName("리뷰 추가 (addRating)")
	class Add {

		@Test
		@DisplayName("점수를 추가하면 리뷰 개수가 1 증가한다")
		void incrementsCount() {
			ListingReviewSummary summary = summary();

			summary.addRating(5);

			assertThat(summary.getReviewCount()).isEqualTo(1);
		}

		@Test
		@DisplayName("여러 점수의 평균이 정확히 계산된다")
		void computesAverage() {
			ListingReviewSummary summary = summary();

			summary.addRating(5);
			summary.addRating(4);
			summary.addRating(3);

			assertThat(summary.getAverageRating()).isEqualTo(4.0);
		}

		@Test
		@DisplayName("1~5 범위를 벗어난 점수는 예외다")
		void rejectsOutOfRange() {
			ListingReviewSummary summary = summary();

			assertThatThrownBy(() -> summary.addRating(0))
				.isInstanceOf(BusinessException.class)
				.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REVIEW_RATING);
			assertThatThrownBy(() -> summary.addRating(6))
				.isInstanceOf(BusinessException.class)
				.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REVIEW_RATING);
		}
	}

	@Nested
	@DisplayName("리뷰 삭제 (removeRating)")
	class Remove {

		@Test
		@DisplayName("점수를 삭제하면 해당 버킷과 개수가 감소한다")
		void decrements() {
			ListingReviewSummary summary = summary();
			summary.addRating(5);
			summary.addRating(5);

			summary.removeRating(5);

			assertThat(summary.getReviewCount()).isEqualTo(1);
			assertThat(summary.getAverageRating()).isEqualTo(5.0);
		}

		@Test
		@DisplayName("마지막 리뷰를 삭제하면 평균은 다시 null이다")
		void averageNullWhenEmpty() {
			ListingReviewSummary summary = summary();
			summary.addRating(3);

			summary.removeRating(3);

			assertThat(summary.getReviewCount()).isZero();
			assertThat(summary.getAverageRating()).isNull();
		}
	}

	@Nested
	@DisplayName("리뷰 수정 (changeRating)")
	class Change {

		@Test
		@DisplayName("점수를 변경하면 개수는 그대로, 평균만 바뀐다")
		void keepsCountChangesAverage() {
			ListingReviewSummary summary = summary();
			summary.addRating(2);

			summary.changeRating(2, 4);

			assertThat(summary.getReviewCount()).isEqualTo(1);
			assertThat(summary.getAverageRating()).isEqualTo(4.0);
		}
	}
}
