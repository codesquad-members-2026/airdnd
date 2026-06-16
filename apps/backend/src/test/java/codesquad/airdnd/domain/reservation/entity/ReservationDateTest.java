package codesquad.airdnd.domain.reservation.entity;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.member.Member;

class ReservationDateTest {

	private static final Long LISTING_ID = 10L;
	private static final Long RESERVATION_ID = 99L;

	private final Member guest = Member.builder().nickname("guest").build();

	private Reservation reservation(LocalDate checkIn, LocalDate checkOut) {
		Listing listing = Listing.builder()
			.name("테스트 숙소")
			.pricePerNight(BigDecimal.valueOf(50000))
			.build();
		ReflectionTestUtils.setField(listing, "id", LISTING_ID);

		Reservation reservation = Reservation.create(
			guest, listing, checkIn, checkOut, GuestCounts.create(2, 0, 0, 0)
		);
		ReflectionTestUtils.setField(reservation, "reservationId", RESERVATION_ID);
		return reservation;
	}

	@Test
	@DisplayName("숙박일수만큼 ReservationDate가 생성된다 (체크인 포함, 체크아웃 제외)")
	void generatesOneDatePerNight() {
		// 7/1 ~ 7/4 = 3박
		List<ReservationDate> dates = ReservationDate.from(
			reservation(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 4))
		);

		assertThat(dates).hasSize(3);
		assertThat(dates).extracting(ReservationDate::getStayDate)
			.containsExactly(
				LocalDate.of(2026, 7, 1),
				LocalDate.of(2026, 7, 2),
				LocalDate.of(2026, 7, 3)
			);
	}

	@Test
	@DisplayName("1박 예약은 체크인 날짜 하나의 ReservationDate만 생성한다")
	void singleNightGeneratesOneDate() {
		List<ReservationDate> dates = ReservationDate.from(
			reservation(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 2))
		);

		assertThat(dates).hasSize(1);
		assertThat(dates.get(0).getStayDate()).isEqualTo(LocalDate.of(2026, 7, 1));
	}

	@Test
	@DisplayName("생성된 ReservationDate는 숙소 ID와 예약 ID를 가진다")
	void carriesListingIdAndReservationId() {
		List<ReservationDate> dates = ReservationDate.from(
			reservation(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3))
		);

		assertThat(dates).allSatisfy(d -> {
			assertThat(d.getListingId()).isEqualTo(LISTING_ID);
			assertThat(d.getReservationId()).isEqualTo(RESERVATION_ID);
		});
	}
}
