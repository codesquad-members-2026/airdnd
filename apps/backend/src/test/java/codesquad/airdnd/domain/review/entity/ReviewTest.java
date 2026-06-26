package codesquad.airdnd.domain.review.entity;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class ReviewTest {

	private static final Long AUTHOR_ID = 10L;

	@Mock
	private Reservation reservation;

	@Mock
	private Member author;

	@Nested
	@DisplayName("생성 성공")
	class Success {

		@Test
		@DisplayName("완료된 예약의 게스트 본인은 리뷰를 작성할 수 있다")
		void createsReview() {
			given(author.getId()).willReturn(AUTHOR_ID);
			given(reservation.isOwnedBy(AUTHOR_ID)).willReturn(true);
			given(reservation.isCompleted()).willReturn(true);

			Review review = Review.create(reservation, author, 5, "좋아요");

			assertThat(review.getRating()).isEqualTo(5);
			assertThat(review.getContent()).isEqualTo("좋아요");
			assertThat(review.getReservation()).isSameAs(reservation);
			assertThat(review.getAuthor()).isSameAs(author);
		}
	}

	@Nested
	@DisplayName("생성 실패")
	class Failure {

		@Test
		@DisplayName("예약한 게스트 본인이 아니면 예외다")
		void rejectsNonOwner() {
			given(author.getId()).willReturn(AUTHOR_ID);
			given(reservation.isOwnedBy(AUTHOR_ID)).willReturn(false);

			assertThatThrownBy(() -> Review.create(reservation, author, 5, "좋아요"))
				.isInstanceOf(BusinessException.class)
				.hasFieldOrPropertyWithValue("errorCode", ErrorCode.REVIEW_NOT_RESERVATION_OWNER);
		}

		@Test
		@DisplayName("완료되지 않은 예약은 리뷰를 쓸 수 없다")
		void rejectsNotCompleted() {
			given(author.getId()).willReturn(AUTHOR_ID);
			given(reservation.isOwnedBy(AUTHOR_ID)).willReturn(true);
			given(reservation.isCompleted()).willReturn(false);

			assertThatThrownBy(() -> Review.create(reservation, author, 5, "좋아요"))
				.isInstanceOf(BusinessException.class)
				.hasFieldOrPropertyWithValue("errorCode", ErrorCode.REVIEW_RESERVATION_NOT_COMPLETED);
		}

		@Test
		@DisplayName("별점이 1~5 범위를 벗어나면 예외다")
		void rejectsOutOfRangeRating() {
			given(author.getId()).willReturn(AUTHOR_ID);
			given(reservation.isOwnedBy(AUTHOR_ID)).willReturn(true);
			given(reservation.isCompleted()).willReturn(true);

			assertThatThrownBy(() -> Review.create(reservation, author, 6, "좋아요"))
				.isInstanceOf(BusinessException.class)
				.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REVIEW_RATING);
		}
	}
}
