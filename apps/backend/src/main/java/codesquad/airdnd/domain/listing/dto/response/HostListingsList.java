package codesquad.airdnd.domain.listing.dto.response;

import java.util.List;

public record HostListingsList(
	List<HostListingSummary> listings
) {

}
