package codesquad.airdnd.domain.listing.dto.response;

import java.math.BigDecimal;
import java.util.List;

import codesquad.airdnd.domain.listing.dto.query.ListingSearchResponse;
import codesquad.airdnd.domain.listing.entity.Capacity;

public record ListingCardResponse(
	Long id,

	double lat,
	double lng,

	String name,
	Capacity capacity,
	BigDecimal totalPrice,

	List<String> images,

	Long wishlistId,

	Double averageRating,
	int reviewCount
) {
	public static ListingCardResponse from(
		ListingSearchResponse searchResponse, List<String> images, Long wishlistId, long nights,
		Double averageRating, int reviewCount
	) {
		BigDecimal totalPrice = nights > 0
			? searchResponse.pricePerNight().multiply(BigDecimal.valueOf(nights))
			: searchResponse.pricePerNight();

		return new ListingCardResponse(
			searchResponse.id(),
			searchResponse.getLatitude(),
			searchResponse.getLongitude(),
			searchResponse.name(),
			searchResponse.capacity(),
			totalPrice,
			images,
			wishlistId,
			averageRating,
			reviewCount
		);
	}
}
