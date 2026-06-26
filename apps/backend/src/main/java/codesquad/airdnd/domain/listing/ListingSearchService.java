package codesquad.airdnd.domain.listing;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

	public PageResponse<ListingCardResponse> search(
		Long guestId, ListingSearchCondition condition, ListingPageRequest pageRequest
	) {
		Page<ListingSearchResponse> page = listingQueryRepository.searchListings(condition, pageRequest.toPageable());

		List<Long> listingIds = page.getContent().stream()
			.map(ListingSearchResponse::id)
			.toList();

		Map<Long, List<String>> imageMap = imageRepository.findImagesByListingIds(listingIds);

		Set<Long> wishlistedIds = guestId == null
				? Set.of()
				: wishlistItemRepository.findWishlistedListingIds(guestId, listingIds);

		Page<ListingCardResponse> cardPage = page.map(c -> ListingCardResponse.from(
			c, imageMap.getOrDefault(c.id(), List.of()), wishlistedIds.contains(c.id())
		));

		return PageResponse.from(cardPage);
	}

	public ListingDetailResponse getListingDetail(Long guestId, Long listingsId) {
		Listing listing = listingQueryRepository.findDetailById(listingsId)
			.orElseThrow(() -> new BusinessException(ErrorCode.LISTING_NOT_FOUND));

		Address address = listing.getAddress();
		String addressSummary = regionCodeService.getAddressSummary(address.getSidoCode(), address.getSigunguCode());

		boolean isWishlisted = false;
		if (guestId != null) {
			isWishlisted = wishlistItemRepository.existsByMemberIdAndListingId(guestId, listingsId);
		}

		// TODO: 리뷰 도메인 구현 후 실제 평점/리뷰 수로 교체
		return ListingDetailResponse.from(
			listing,
			new ReviewSummary(0, null),
			addressSummary,
			isWishlisted
		);
	}

}
