package codesquad.airdnd.domain.reservation.entity;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;

class ReservationTest {

	private final Member guest = Member.builder().nickname("guest").build();

	private Listing listing(BigDecimal pricePerNight) {
		return Listing.builder()
			.name("테스트 숙소")
			.pricePerNight(pricePerNight)
			.build();
	}

	private GuestCounts guestCounts() {
		return GuestCounts.create(2, 0, 0, 0);
	}

	@Nested
	@DisplayName("예약 생성 (create)")
	class Create {

		@Test
		@DisplayName("새로 생성된 예약의 초기 상태는 PENDING이다")
		void initialStateIsPending() {
			Reservation reservation = Reservation.create(
				guest, listing(BigDecimal.valueOf(50000)),
				LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3), guestCounts()
			);

			assertThat(reservation.getState()).isEqualTo(ReservationState.PENDING);
		}

		@Test
		@DisplayName("총 가격은 1박 가격 * 숙박일수로 계산된다")
		void totalPriceIsPricePerNightTimesNights() {
			// 7/1 ~ 7/3 = 2박
			Reservation reservation = Reservation.create(
				guest, listing(BigDecimal.valueOf(50000)),
				LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3), guestCounts()
			);

			assertThat(reservation.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(100000));
		}

		@Test
		@DisplayName("1박 예약의 총 가격은 1박 가격과 같다")
		void totalPriceForSingleNight() {
			Reservation reservation = Reservation.create(
				guest, listing(BigDecimal.valueOf(80000)),
				LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 2), guestCounts()
			);

			assertThat(reservation.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(80000));
		}

		@Test
		@DisplayName("게스트, 숙소, 날짜, 인원 정보가 그대로 저장된다")
		void storesGivenValues() {
			Listing listing = listing(BigDecimal.valueOf(50000));
			GuestCounts counts = GuestCounts.create(2, 1, 1, 1);

			Reservation reservation = Reservation.create(
				guest, listing,
				LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3), counts
			);

			assertThat(reservation.getGuest()).isSameAs(guest);
			assertThat(reservation.getListing()).isSameAs(listing);
			assertThat(reservation.getCheckInDate()).isEqualTo(LocalDate.of(2026, 7, 1));
			assertThat(reservation.getCheckOutDate()).isEqualTo(LocalDate.of(2026, 7, 3));
			assertThat(reservation.getGuestCounts()).isSameAs(counts);
		}
	}

	@Nested
	@DisplayName("예약 날짜 검증")
	class DateValidation {

		@Test
		@DisplayName("체크아웃이 체크인보다 빠르면 INVALID_RESERVATION_DATE 예외가 발생한다")
		void throwsWhenCheckOutBeforeCheckIn() {
			assertThatThrownBy(() -> Reservation.create(
				guest, listing(BigDecimal.valueOf(50000)),
				LocalDate.of(2026, 7, 3), LocalDate.of(2026, 7, 1), guestCounts()
			))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.INVALID_RESERVATION_DATE);
		}

		@Test
		@DisplayName("체크인과 체크아웃이 같은 날이면 INVALID_RESERVATION_DATE 예외가 발생한다")
		void throwsWhenCheckInEqualsCheckOut() {
			assertThatThrownBy(() -> Reservation.create(
				guest, listing(BigDecimal.valueOf(50000)),
				LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 1), guestCounts()
			))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.INVALID_RESERVATION_DATE);
		}
	}
}
