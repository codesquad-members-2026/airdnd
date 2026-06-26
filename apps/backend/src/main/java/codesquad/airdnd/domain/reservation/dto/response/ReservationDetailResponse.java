package codesquad.airdnd.domain.reservation.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.ListingImage;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.domain.reservation.entity.ReservationState;

public record ReservationDetailResponse(
	Long reservationId,
	Long listingId,

	String listingTitle,
	List<String> images,
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

		List<String> images = l.getImages().stream()
			.sorted(Comparator.comparingInt(ListingImage::getSortOrder))
			.map(ListingImage::getImageUrl)
			.toList();

		return new ReservationDetailResponse(
			r.getReservationId(),
			l.getId(),

			l.getName(),
			images,
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
