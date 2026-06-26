package codesquad.airdnd.domain.listing;

import java.util.List;
import java.util.Map;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import codesquad.airdnd.domain.listing.dto.request.ListingCreateRequest;
import codesquad.airdnd.domain.listing.dto.response.HostListingSummary;
import codesquad.airdnd.domain.listing.dto.response.HostListingsList;
import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.repository.ListingImageRepository;
import codesquad.airdnd.domain.listing.repository.ListingRepository;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import codesquad.airdnd.global.geocoding.KakaoGeocodingService;
import codesquad.airdnd.global.geocoding.KakaoRegionInfo;
import codesquad.airdnd.global.region.RegionCodeService;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ListingService {

	private static final double LAT_MIN = 33.0;
	private static final double LAT_MAX = 38.9;
	private static final double LON_MIN = 124.6;
	private static final double LON_MAX = 131.9;

	private final ListingRepository listingRepository;
	private final ListingImageRepository listingImageRepository;
	private final MemberRepository memberRepository;

	private final KakaoGeocodingService kakaoGeocodingService;
	private final RegionCodeService regionCodeService;

	public void submitListing(Long hostId, ListingCreateRequest request) {
		validateKoreanBounds(request.latitude(), request.longitude());

		Address address = buildAddress(request);
		Member host = memberRepository.getReferenceById(hostId);
		Listing listing = request.toListing(host, address);

		listingRepository.save(listing);
	}

	@Transactional(readOnly = true)
	public HostListingsList getHostListings(Long hostId) {
		Member host = memberRepository.getReferenceById(hostId);
		List<Listing> listings = listingRepository.findAllByHost(host);

		Map<Long, String> imageMap = listingImageRepository.findCoverByHostId(hostId);

		return new HostListingsList(
			listings.stream()
				.map(listing -> HostListingSummary.from(
					listing,
					regionCodeService.getAddressSummary(
						listing.getAddress().getSidoCode(),
						listing.getAddress().getSigunguCode()
					),
					imageMap.get(listing.getId())
					))
				.toList()
		);
	}

	public void activate(Long hostId, Long listingsId) {
		Member host = memberRepository.getReferenceById(hostId);
		Listing listing = findById(listingsId);

		validateOwner(listing, host);
		validateApproved(listing);

		listing.activate();
	}

	public void deactivate(Long hostId, Long listingsId) {
		Member host = memberRepository.getReferenceById(hostId);
		Listing listing = findById(listingsId);

		validateOwner(listing, host);
		validateApproved(listing);

		listing.deactivate();
	}

	private void validateKoreanBounds(double latitude, double longitude) {
		boolean outOfBounds = latitude < LAT_MIN || latitude > LAT_MAX
			|| longitude < LON_MIN || longitude > LON_MAX;
		if (outOfBounds) {
			throw new BusinessException(ErrorCode.INVALID_LOCATION);
		}
	}

	private Address buildAddress(ListingCreateRequest request) {
		KakaoRegionInfo region = kakaoGeocodingService.reverseGeocode(request.latitude(), request.longitude());

		GeometryFactory factory = new GeometryFactory(new PrecisionModel(), 4326);

		Point point = factory.createPoint(
			new Coordinate(request.longitude(), request.latitude()));

		return new Address(
			request.roadAddress(), request.detailAddress(), request.postalCode(),
			point, region.sidoCode(), region.sigunguCode()
		);
	}

	private Listing findById(Long listingId) {
		return listingRepository.findById(listingId)
			.orElseThrow(() -> new BusinessException(ErrorCode.LISTING_NOT_FOUND));
	}

	private void validateOwner(Listing listing, Member host) {
		if (!listing.isOwnedBy(host)) {
			throw new BusinessException(ErrorCode.NOT_LISTING_OWNER);
		}
	}

	private void validateApproved(Listing listing) {
		if (!listing.isApproved()) {
			throw new BusinessException(ErrorCode.LISTING_NOT_APPROVED);
		}
	}
}
