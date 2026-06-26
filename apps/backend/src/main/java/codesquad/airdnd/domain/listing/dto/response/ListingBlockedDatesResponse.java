package codesquad.airdnd.domain.listing.dto.response;

import java.time.LocalDate;
import java.util.List;

public record ListingBlockedDatesResponse(
	Long listingId,
	LocalDate from,
	LocalDate to,
	List<LocalDate> blockedDates
) {
	public static ListingBlockedDatesResponse of(
		Long listingId, LocalDate from, LocalDate to, List<LocalDate> blockedDates
	) {
		return new ListingBlockedDatesResponse(listingId, from, to, blockedDates);
	}
}
