package codesquad.airdnd.domain.listing.dto.response;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Amenity;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.ListingImage;

public record ListingDetailResponse(
	Long listingId,
	String name,
	String description,
	List<String> images,
	Double latitude,
	Double longitude,
	String location,
	BigDecimal pricePerNight,
	Capacity capacity,
	Set<Amenity> amenities,
	ReviewSummary review,
	HostInfo host,
	Long wishlistId
) {
	public static ListingDetailResponse from(
		Listing listing, ReviewSummary review, String addressSummary, Long wishlistId
	) {
		Address address = listing.getAddress();

		List<String> images = listing.getImages().stream()
			.sorted(Comparator.comparingInt(ListingImage::getSortOrder))
			.map(ListingImage::getImageUrl)
			.toList();

		return new ListingDetailResponse(
			listing.getId(),
			listing.getName(),
			listing.getDescription(),
			images,
			address.getLatitude(),
			address.getLongitude(),
			addressSummary,
			listing.getPricePerNight(),
			listing.getCapacity(),
			listing.getAmenities(),
			review,
			HostInfo.from(listing.getHost()),
                wishlistId
		);
	}
}
