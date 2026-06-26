package codesquad.airdnd.domain.listing;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import codesquad.airdnd.domain.listing.dto.request.ListingCreateRequest;
import codesquad.airdnd.domain.listing.dto.response.HostListingsList;
import codesquad.airdnd.global.response.ApiResponse;
import codesquad.airdnd.global.auth.CurrentMember;
import codesquad.airdnd.global.auth.CurrentMemberInfo;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/host/listings")
public class HostController {
	private final ListingService listingService;

	@PostMapping
	public ResponseEntity<ApiResponse<Void>> createListing(
		@CurrentMember CurrentMemberInfo memberInfo, @RequestBody @Valid ListingCreateRequest request
	) {
		listingService.submitListing(memberInfo.id(), request);
		return ResponseEntity.ok(ApiResponse.success(null));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<HostListingsList>> getHostListings(
		@CurrentMember CurrentMemberInfo memberInfo
	) {
		HostListingsList hostListings = listingService.getHostListings(memberInfo.id());

		return ResponseEntity.ok(ApiResponse.success(hostListings));
	}


	@PatchMapping("/{listingsId}/activate")
	public ResponseEntity<ApiResponse<Void>> activateListing(
		@CurrentMember CurrentMemberInfo memberInfo,
		@PathVariable Long listingsId
	) {
		listingService.activate(memberInfo.id(), listingsId);
		return ResponseEntity.ok(ApiResponse.success(null));
	}

	@PatchMapping("/{listingsId}/deactivate")
	public ResponseEntity<ApiResponse<Void>> deactivateListing(
		@CurrentMember CurrentMemberInfo memberInfo,
		@PathVariable Long listingsId
	) {
		listingService.deactivate(memberInfo.id(), listingsId);
		return ResponseEntity.ok(ApiResponse.success(null));
	}
}
