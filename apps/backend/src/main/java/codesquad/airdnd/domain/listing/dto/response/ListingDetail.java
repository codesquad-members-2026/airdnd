package codesquad.airdnd.domain.listing.dto.response;

import java.math.BigDecimal;
import java.util.Set;

import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Amenity;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.RoomType;

public record ListingDetail(
	Long listingId,
	String name,
	RoomType roomType,
	String description,
	Address address,
	String hostName,
	Capacity capacity,
	BigDecimal pricePerNight,
	Set<Amenity> amenities
) {
	public static ListingDetail from(Listing listing) {
		return new ListingDetail(
			listing.getId(),
			listing.getName(),
			listing.getRoomType(),
			listing.getDescription(),
			listing.getAddress(),
			listing.getHost().getNickname(),
			listing.getCapacity(),
			listing.getPricePerNight(),
			listing.getAmenities()
		);
	}
}
