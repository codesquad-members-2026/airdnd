package codesquad.airdnd.domain.listing.dto.request;

import codesquad.airdnd.domain.listing.dto.query.DateRangeFilter;
import codesquad.airdnd.domain.listing.dto.query.GuestCountFilter;
import codesquad.airdnd.domain.listing.dto.query.MapBoundsFilter;
import codesquad.airdnd.domain.listing.dto.query.PriceRangeFilter;
import codesquad.airdnd.domain.listing.dto.query.RegionFilter;
import jakarta.validation.Valid;

public record ListingSearchCondition(
	MapBoundsFilter mapBounds,

	RegionFilter region,

	@Valid DateRangeFilter dateRange,

	@Valid GuestCountFilter guestCount,

	@Valid PriceRangeFilter priceRange
) {

}
