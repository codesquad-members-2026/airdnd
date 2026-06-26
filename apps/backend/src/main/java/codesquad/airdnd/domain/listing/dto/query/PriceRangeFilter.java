package codesquad.airdnd.domain.listing.dto.query;

import java.math.BigDecimal;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record PriceRangeFilter(
	@Positive(message = "최소 가격은 0 이상이어야 합니다.") BigDecimal minPrice,
	@Positive(message = "최대 가격은 0 이상이어야 합니다.") BigDecimal maxPrice
) {
	public boolean isPresent() {
		return minPrice != null || maxPrice != null;
	}

	public boolean isValidRange() {
		return minPrice == null || maxPrice == null || maxPrice.compareTo(minPrice) >= 0;
	}
}
