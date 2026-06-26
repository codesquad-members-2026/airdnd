package codesquad.airdnd.domain.listing;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.mockito.Mockito.never;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import codesquad.airdnd.domain.listing.dto.query.ListingSearchResponse;
import codesquad.airdnd.domain.listing.dto.request.ListingPageRequest;
import codesquad.airdnd.domain.listing.dto.request.ListingSearchCondition;
import codesquad.airdnd.domain.listing.dto.response.ListingCardResponse;
import codesquad.airdnd.domain.listing.dto.response.ListingDetailResponse;
import codesquad.airdnd.domain.wishlistItem.dto.query.WishlistedListing;
import codesquad.airdnd.global.response.PageResponse;
import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Amenity;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.ListingImage;
import codesquad.airdnd.domain.listing.entity.RoomType;
import codesquad.airdnd.domain.listing.repository.ListingImageRepository;
import codesquad.airdnd.domain.listing.repository.ListingQueryRepository;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.review.entity.ListingReviewSummary;
import codesquad.airdnd.domain.review.repository.ListingReviewSummaryRepository;
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

	@Mock
	private ListingReviewSummaryRepository reviewSummaryRepository;

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
		@DisplayName("회원이 찜한 숙소면 담긴 위시리스트의 wishlistId를 반환한다")
		void marksWishlisted() {
			// given
			Listing listing = approvedListing();
			ReflectionTestUtils.setField(listing, "id", 1L);
			given(listingQueryRepository.findDetailById(1L)).willReturn(Optional.of(listing));
			given(regionCodeService.getAddressSummary("11", "11680")).willReturn("강남구, 서울");
			given(wishlistItemRepository.findWishlistId(GUEST_ID, 1L)).willReturn(7L);

			// when
			ListingDetailResponse result = listingSearchService.getListingDetail(GUEST_ID, 1L);

			// then
			assertThat(result.wishlistId()).isEqualTo(7L);
		}

		@Test
		@DisplayName("찜하지 않은 숙소면 wishlistId가 null이다")
		void notWishlisted() {
			// given
			Listing listing = approvedListing();
			ReflectionTestUtils.setField(listing, "id", 1L);
			given(listingQueryRepository.findDetailById(1L)).willReturn(Optional.of(listing));
			given(regionCodeService.getAddressSummary("11", "11680")).willReturn("강남구, 서울");
			given(wishlistItemRepository.findWishlistId(GUEST_ID, 1L)).willReturn(null);

			// when
			ListingDetailResponse result = listingSearchService.getListingDetail(GUEST_ID, 1L);

			// then
			assertThat(result.wishlistId()).isNull();
		}

		@Test
		@DisplayName("비로그인(guestId null)이면 위시리스트 조회 없이 wishlistId가 null이다")
		void notWishlistedWhenAnonymous() {
			// given
			Listing listing = approvedListing();
			ReflectionTestUtils.setField(listing, "id", 1L);
			given(listingQueryRepository.findDetailById(1L)).willReturn(Optional.of(listing));
			given(regionCodeService.getAddressSummary("11", "11680")).willReturn("강남구, 서울");

			// when
			ListingDetailResponse result = listingSearchService.getListingDetail(null, 1L);

			// then
			assertThat(result.wishlistId()).isNull();
			then(wishlistItemRepository).should(never()).findWishlistId(any(), any());
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

		@Test
		@DisplayName("리뷰 통계가 있으면 평점과 리뷰 수를 반환한다")
		void returnsReviewSummary() {
			Listing listing = approvedListing();
			ReflectionTestUtils.setField(listing, "id", 1L);
			given(listingQueryRepository.findDetailById(1L)).willReturn(Optional.of(listing));
			given(regionCodeService.getAddressSummary("11", "11680")).willReturn("강남구, 서울");

			ListingReviewSummary summary = ListingReviewSummary.create(listing);
			summary.addRating(5);
			summary.addRating(4);
			given(reviewSummaryRepository.findById(1L)).willReturn(Optional.of(summary));

			ListingDetailResponse result = listingSearchService.getListingDetail(GUEST_ID, 1L);

			assertThat(result.review().reviewCount()).isEqualTo(2);
			assertThat(result.review().averageRating()).isEqualTo(4.5);
		}

		@Test
		@DisplayName("리뷰 통계가 없으면 리뷰 수 0, 평점 null을 반환한다")
		void returnsEmptyReviewSummary() {
			Listing listing = approvedListing();
			ReflectionTestUtils.setField(listing, "id", 1L);
			given(listingQueryRepository.findDetailById(1L)).willReturn(Optional.of(listing));
			given(regionCodeService.getAddressSummary("11", "11680")).willReturn("강남구, 서울");
			given(reviewSummaryRepository.findById(1L)).willReturn(Optional.empty());

			ListingDetailResponse result = listingSearchService.getListingDetail(GUEST_ID, 1L);

			assertThat(result.review().reviewCount()).isZero();
			assertThat(result.review().averageRating()).isNull();
		}
	}

	@Nested
	@DisplayName("숙소 검색 (search)")
	class Search {

		private static final Long GUEST_ID = 10L;

		@Test
		@DisplayName("찜한 숙소 카드에는 담긴 wishlistId가, 안 찜한 카드에는 null이 채워진다")
		void mapsWishlistIdPerCard() {
			// given - 숙소 1, 2 중 1만 wishlistId=7 에 담겨 있음
			Page<ListingSearchResponse> page = new PageImpl<>(List.of(
				searchResponse(1L), searchResponse(2L)
			));
			given(listingQueryRepository.searchListings(any(), any())).willReturn(page);
			given(imageRepository.findImagesByListingIds(any())).willReturn(Map.of());
			given(wishlistItemRepository.findWishlistedPairs(eq(GUEST_ID), any()))
				.willReturn(List.of(new WishlistedListing(1L, 7L)));

			// when
			PageResponse<ListingCardResponse> result =
				listingSearchService.search(GUEST_ID, new ListingSearchCondition(null, null, null, null, null), pageRequest());

			// then
			assertThat(result.content())
				.extracting(ListingCardResponse::id, ListingCardResponse::wishlistId)
				.containsExactly(
					tuple(1L, 7L),
					tuple(2L, null)
				);
		}

		@Test
		@DisplayName("비로그인(guestId null)이면 위시리스트 조회 없이 모든 카드의 wishlistId가 null이다")
		void noWishlistLookupWhenAnonymous() {
			// given
			Page<ListingSearchResponse> page = new PageImpl<>(List.of(searchResponse(1L)));
			given(listingQueryRepository.searchListings(any(), any())).willReturn(page);
			given(imageRepository.findImagesByListingIds(any())).willReturn(Map.of());

			// when
			PageResponse<ListingCardResponse> result =
				listingSearchService.search(null, new ListingSearchCondition(null, null, null, null, null), pageRequest());

			// then
			assertThat(result.content()).extracting(ListingCardResponse::wishlistId).containsOnlyNulls();
			then(wishlistItemRepository).should(never()).findWishlistedPairs(any(), any());
		}

		private ListingSearchResponse searchResponse(Long id) {
			return new ListingSearchResponse(
				id, point(37.5, 127.0), "숙소" + id, new Capacity(2, 1, 1, 1),
				BigDecimal.valueOf(50000), BigDecimal.valueOf(50000)
			);
		}

		private ListingPageRequest pageRequest() {
			return new ListingPageRequest(0, 20);
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
