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

	boolean isWishlisted
) {
	public static ListingCardResponse from(
		ListingSearchResponse searchResponse, List<String> images, boolean isWishlisted
	) {
		return new ListingCardResponse(
			searchResponse.id(),
			searchResponse.getLatitude(),
			searchResponse.getLongitude(),
			searchResponse.name(),
			searchResponse.capacity(),
			searchResponse.pricePerNight(), //todo: 계산 로직
			images,
			isWishlisted
		);
	}
}
