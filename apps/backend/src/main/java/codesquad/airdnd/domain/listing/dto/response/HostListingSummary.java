package codesquad.airdnd.domain.listing.dto.response;

import java.math.BigDecimal;

import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.ListingState;
import codesquad.airdnd.domain.listing.entity.RoomType;

public record HostListingSummary(
	Long id,
	String name,
	RoomType roomType,
	String addressSummary,
	Capacity capacity,
	BigDecimal pricePerNight,
	ListingState state,
	String coverImage
) {
	public static HostListingSummary from(Listing listing, String addressSummary, String cover) {
		return new HostListingSummary(
			listing.getId(),
			listing.getName(),
			listing.getRoomType(),
			addressSummary,
			listing.getCapacity(),
			listing.getPricePerNight(),
			listing.getState(),
			cover
		);
	}
}
