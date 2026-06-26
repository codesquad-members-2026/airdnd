package codesquad.airdnd.domain.listing;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import codesquad.airdnd.domain.listing.dto.request.ListingPageRequest;
import codesquad.airdnd.domain.listing.dto.request.ListingSearchCondition;
import codesquad.airdnd.domain.listing.dto.response.ListingCardResponse;
import codesquad.airdnd.domain.listing.dto.response.ListingDetailResponse;
import codesquad.airdnd.global.auth.CurrentMember;
import codesquad.airdnd.global.auth.CurrentMemberInfo;
import codesquad.airdnd.global.response.ApiResponse;
import codesquad.airdnd.global.response.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api/listings")
public class ListingController {
	private final ListingSearchService listingSearchService;

	@GetMapping
	public ApiResponse<PageResponse<ListingCardResponse>> getListings(
		@CurrentMember CurrentMemberInfo guest,
		@ModelAttribute ListingSearchCondition condition,
		@ModelAttribute @Valid ListingPageRequest pageRequest
	) {
		PageResponse<ListingCardResponse> response = listingSearchService.search(guest.id(), condition, pageRequest);
		return ApiResponse.success(response);
	}

	@GetMapping("/{listingsId}")
	public ResponseEntity<ApiResponse<ListingDetailResponse>> getHostListingDetail(
		@CurrentMember CurrentMemberInfo guest,
		@PathVariable @Min(1) Long listingsId
	) {
		ListingDetailResponse listingDetail = listingSearchService.getListingDetail(guest.id(),listingsId);
		return ResponseEntity.ok(ApiResponse.success(listingDetail));
	}
}
