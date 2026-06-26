package codesquad.airdnd.domain.listing.dto.request;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ListingPageRequest(
	@Min(0)
	Integer page,

	@Min(1)
	@Max(MAX_PAGE_SIZE)
	Integer size
) {
	private static final int DEFAULT_PAGE_SIZE = 20;
	private static final int MAX_PAGE_SIZE = 50;

	public Pageable toPageable() {
		return PageRequest.of(
			page == null ? 0 : page,
			size == null ? DEFAULT_PAGE_SIZE : size
		);
	}
}
