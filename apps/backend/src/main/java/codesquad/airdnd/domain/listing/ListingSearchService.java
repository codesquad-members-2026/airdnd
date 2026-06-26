package codesquad.airdnd.domain.listing;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import codesquad.airdnd.domain.wishlistItem.dto.query.WishlistedListing;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import codesquad.airdnd.domain.listing.dto.query.DateRangeFilter;
import codesquad.airdnd.domain.listing.dto.query.ListingSearchResponse;
import codesquad.airdnd.domain.listing.dto.request.ListingPageRequest;
import codesquad.airdnd.domain.listing.dto.request.ListingSearchCondition;
import codesquad.airdnd.domain.listing.dto.response.ListingCardResponse;
import codesquad.airdnd.domain.listing.dto.response.ListingDetailResponse;
import codesquad.airdnd.domain.listing.dto.response.ReviewSummary;
import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.repository.ListingImageRepository;
import codesquad.airdnd.domain.listing.repository.ListingQueryRepository;
import codesquad.airdnd.domain.review.entity.ListingReviewSummary;
import codesquad.airdnd.domain.review.repository.ListingReviewSummaryRepository;
import codesquad.airdnd.domain.wishlistItem.WishlistItemRepository;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import codesquad.airdnd.global.region.RegionCodeService;
import codesquad.airdnd.global.response.PageResponse;
import lombok.RequiredArgsConstructor;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ListingSearchService {
	private final ListingQueryRepository listingQueryRepository;
	private final ListingImageRepository imageRepository;
	private final WishlistItemRepository wishlistItemRepository;
	private final RegionCodeService regionCodeService;
	private final ListingReviewSummaryRepository reviewSummaryRepository;

	public PageResponse<ListingCardResponse> search(
		Long guestId, ListingSearchCondition condition, ListingPageRequest pageRequest
	) {
		DateRangeFilter dateRange = condition.dateRange();

		long nights = dateRange == null
			? 1
			: ChronoUnit.DAYS.between(
			dateRange.checkIn(),
			dateRange.checkOut()
		);

		Page<ListingSearchResponse> page = listingQueryRepository.searchListings(condition, pageRequest.toPageable());

		List<Long> listingIds = page.getContent().stream()
			.map(ListingSearchResponse::id)
			.toList();

		Map<Long, List<String>> imageMap = imageRepository.findImagesByListingIds(listingIds);

		Map<Long, Long> wishlistIdByListing = guestId == null
				? Map.of()
				: wishlistItemRepository.findWishlistedPairs(guestId, listingIds).stream()
                    .collect(Collectors.toMap(
                            WishlistedListing::listingId,
                            WishlistedListing::wishlistId
                    ));


		Map<Long, ListingReviewSummary> summaryMap = reviewSummaryRepository.findAllById(listingIds).stream()
			.collect(Collectors.toMap(ListingReviewSummary::getListingId, s -> s));

		Page<ListingCardResponse> cardPage = page.map(c -> {
			ListingReviewSummary summary = summaryMap.get(c.id());
			return ListingCardResponse.from(
				c, imageMap.getOrDefault(c.id(), List.of()), wishlistIdByListing.get(c.id()), nights,
				summary == null ? null : summary.getAverageRating(),
				summary == null ? 0 : summary.getReviewCount()
			);
		});

		return PageResponse.from(cardPage);
	}

	public ListingDetailResponse getListingDetail(Long guestId, Long listingsId) {
		Listing listing = listingQueryRepository.findDetailById(listingsId)
			.orElseThrow(() -> new BusinessException(ErrorCode.LISTING_NOT_FOUND));

		Address address = listing.getAddress();
		String addressSummary = regionCodeService.getAddressSummary(address.getSidoCode(), address.getSigunguCode());

		Long wishlistId = guestId == null ? null : wishlistItemRepository.findWishlistId(guestId, listingsId);

		ReviewSummary reviewSummary = reviewSummaryRepository.findById(listingsId)
			.map(this::toReviewSummary)
			.orElseGet(() -> new ReviewSummary(0, null));

		return ListingDetailResponse.from(
			listing,
			reviewSummary,
			addressSummary,
                wishlistId
		);
	}

	private ReviewSummary toReviewSummary(ListingReviewSummary summary) {
		return new ReviewSummary(summary.getReviewCount(), summary.getAverageRating());
	}

}
