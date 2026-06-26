package codesquad.airdnd.domain.reservation.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.domain.reservation.entity.ReservationState;

public record ReservationSummary(
	String coverImage,
	Long reservationId,
	Long listingId,
	String listingTitle,
	LocalDate checkInDate,
	LocalDate checkOutDate,
	GuestCountsResponse guestCounts,
	ReservationState state,
	BigDecimal totalPrice,
	String region
) {
	public static ReservationSummary from(Reservation r) {
		return from(r, null);
	}

	public static ReservationSummary from(Reservation r, String region) {
		return new ReservationSummary(
			null, //todo: r.coverImage(),
			r.getReservationId(),
			r.getListing().getId(),
			r.getListing().getName(),
			r.getCheckInDate(),
			r.getCheckOutDate(),
			GuestCountsResponse.from(r.getGuestCounts()),
			r.getState(),
			r.getTotalPrice(),
			region
		);
	}
}
