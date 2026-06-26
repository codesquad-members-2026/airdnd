package codesquad.airdnd.domain.listing;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.mockito.Mockito.never;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import codesquad.airdnd.domain.listing.dto.response.ListingDetailResponse;
import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Amenity;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.ListingImage;
import codesquad.airdnd.domain.listing.entity.RoomType;
import codesquad.airdnd.domain.listing.repository.ListingImageRepository;
import codesquad.airdnd.domain.listing.repository.ListingQueryRepository;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.wishlistItem.WishlistItemRepository;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import codesquad.airdnd.global.region.RegionCodeService;

@ExtendWith(MockitoExtension.class)
class ListingSearchServiceTest {

	@Mock
	private ListingQueryRepository listingQueryRepository;

	@Mock
	private ListingImageRepository imageRepository;

	@Mock
	private WishlistItemRepository wishlistItemRepository;

	@Mock
	private RegionCodeService regionCodeService;

	@InjectMocks
	private ListingSearchService listingSearchService;

	@Nested
	@DisplayName("숙소 상세 조회 (getListingDetail)")
	class GetListingDetail {

		private static final Long GUEST_ID = 10L;

		@Test
		@DisplayName("승인된 숙소 조회 시 상세 정보를 반환한다")
		void returnsDetail() {
			// given
			Listing listing = approvedListing();
			ReflectionTestUtils.setField(listing, "id", 1L);
			given(listingQueryRepository.findDetailById(1L)).willReturn(Optional.of(listing));
			given(regionCodeService.getAddressSummary("11", "11680")).willReturn("강남구, 서울");
			given(wishlistItemRepository.existsByMemberIdAndListingId(GUEST_ID, 1L)).willReturn(false);

			// when
			ListingDetailResponse result = listingSearchService.getListingDetail(GUEST_ID, 1L);

			// then
			assertThat(result.listingId()).isEqualTo(1L);
			assertThat(result.name()).isEqualTo("테스트 숙소");
			assertThat(result.location()).isEqualTo("강남구, 서울");
			assertThat(result.host().name()).isEqualTo("testHost");
			assertThat(result.images()).containsExactly("img1", "img2");
		}

		@Test
		@DisplayName("회원이 찜한 숙소면 isWishlisted가 true다")
		void marksWishlisted() {
			// given
			Listing listing = approvedListing();
			ReflectionTestUtils.setField(listing, "id", 1L);
			given(listingQueryRepository.findDetailById(1L)).willReturn(Optional.of(listing));
			given(regionCodeService.getAddressSummary("11", "11680")).willReturn("강남구, 서울");
			given(wishlistItemRepository.existsByMemberIdAndListingId(GUEST_ID, 1L)).willReturn(true);

			// when
			ListingDetailResponse result = listingSearchService.getListingDetail(GUEST_ID, 1L);

			// then
			assertThat(result.isWishlisted()).isTrue();
		}

		@Test
		@DisplayName("비로그인(guestId null)이면 위시리스트 조회 없이 isWishlisted가 false다")
		void notWishlistedWhenAnonymous() {
			// given
			Listing listing = approvedListing();
			ReflectionTestUtils.setField(listing, "id", 1L);
			given(listingQueryRepository.findDetailById(1L)).willReturn(Optional.of(listing));
			given(regionCodeService.getAddressSummary("11", "11680")).willReturn("강남구, 서울");

			// when
			ListingDetailResponse result = listingSearchService.getListingDetail(null, 1L);

			// then
			assertThat(result.isWishlisted()).isFalse();
			then(wishlistItemRepository).should(never()).existsByMemberIdAndListingId(any(), any());
		}

		@Test
		@DisplayName("존재하지 않는 숙소 조회 시 LISTING_NOT_FOUND 예외가 발생한다")
		void throwsWhenNotFound() {
			// given
			given(listingQueryRepository.findDetailById(99L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> listingSearchService.getListingDetail(GUEST_ID, 99L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.LISTING_NOT_FOUND);
		}
	}

	private Listing approvedListing() {
		Member host = Member.builder().nickname("testHost").build();
		ReflectionTestUtils.setField(host, "id", 1L);

		Listing listing = Listing.builder()
			.name("테스트 숙소")
			.roomType(RoomType.ENTIRE_PLACE)
			.description("설명")
			.address(seoulGangnamAddress())
			.host(host)
			.capacity(new Capacity(2, 1, 1, 1))
			.pricePerNight(BigDecimal.valueOf(50000))
			.amenities(Set.of(Amenity.WIFI))
			.images(ListingImage.from(List.of("img1", "img2")))
			.build();
		listing.activate();
		return listing;
	}

	private Address seoulGangnamAddress() {
		return new Address(
			"서울 강남구 테헤란로 152", "101호", "06236",
			point(37.5012, 127.0396),
			"11", "11680"
		);
	}

	private Point point(double lat, double lng) {
		return new GeometryFactory().createPoint(new Coordinate(lng, lat));
	}
}
