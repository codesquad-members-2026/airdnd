package codesquad.airdnd.domain.listing.dto.query;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record GuestCountFilter(
	@Positive(message = "성인 수는 0 이상이어야 합니다.") Integer adults,
	@PositiveOrZero(message = "어린이 수는 0 이상이어야 합니다.") Integer children,
	@PositiveOrZero(message = "유아 수는 0 이상이어야 합니다.") Integer infants,
	@PositiveOrZero(message = "반려동물 수는 0 이상이어야 합니다.") Integer pets
) {
	public boolean isPresent() {
		return totalHeadcount() > 0 || (pets != null && pets > 0);
	}

	public int totalHeadcount() {
		return nz(adults) + nz(children) + nz(infants);
	}

	private int nz(Integer value) {
		return value == null ? 0 : value;
	}
}
