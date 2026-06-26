package codesquad.airdnd.domain.listing.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import codesquad.airdnd.domain.listing.dto.query.ListingSearchResponse;
import codesquad.airdnd.domain.listing.dto.request.ListingSearchCondition;
import codesquad.airdnd.domain.listing.entity.Listing;

public interface ListingQueryRepository {
	Page<ListingSearchResponse> searchListings(ListingSearchCondition condition, Pageable pageable);

	Optional<Listing> findDetailById(Long listingId);
}
