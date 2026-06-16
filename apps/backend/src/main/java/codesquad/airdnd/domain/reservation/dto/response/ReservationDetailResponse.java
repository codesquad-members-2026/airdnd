package codesquad.airdnd.domain.reservation.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.domain.reservation.entity.ReservationState;

public record ReservationDetailResponse(
	Long reservationId,
	Long listingId,

	String listingTitle,
	String hostName,
	String hostProfileUrl,

	LocalDate checkInDate,
	LocalDate checkOutDate,

	String addressSummary,
	String addressDetail,

	GuestCountsResponse guestCounts,

	double lat,
	double lng,

	BigDecimal totalPrice,
	ReservationState state
) {
	public static ReservationDetailResponse forGuest(Reservation r, String addressSummary) {
		Listing l = r.getListing();
		Member h = l.getHost();
		Address a = l.getAddress();

		return new ReservationDetailResponse(
			r.getReservationId(),
			l.getId(),

			l.getName(),
			h.getNickname(),
			h.getProfileUrl(),

			r.getCheckInDate(),
			r.getCheckOutDate(),

			addressSummary,
			a.getDetail(),

			GuestCountsResponse.from(r.getGuestCounts()),

			l.getAddress().getLatitude(),
			l.getAddress().getLongitude(),

			r.getTotalPrice(),
			r.getState()
		);
	}
}
