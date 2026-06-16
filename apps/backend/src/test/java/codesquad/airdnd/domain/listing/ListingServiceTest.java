package codesquad.airdnd.domain.listing;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.mockito.Mockito.lenient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
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

import codesquad.airdnd.domain.listing.dto.request.ListingCreateRequest;
import codesquad.airdnd.domain.listing.dto.response.HostListingsList;
import codesquad.airdnd.domain.listing.dto.response.ListingDetail;
import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.ListingState;
import codesquad.airdnd.domain.listing.entity.RoomType;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import codesquad.airdnd.global.geocoding.KakaoGeocodingService;
import codesquad.airdnd.global.geocoding.KakaoRegionInfo;
import codesquad.airdnd.global.region.RegionCodeService;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

	@Mock
	private ListingRepository listingRepository;

	@Mock
	private KakaoGeocodingService kakaoGeocodingService;

	@Mock
	private RegionCodeService regionCodeService;

	@Mock
	private MemberRepository memberRepository;

	@InjectMocks
	private ListingService listingService;

	private static final Long HOST_ID = 1L;
	private static final Long OTHER_ID = 2L;

	private Member host;
	private Member otherMember;

	@BeforeEach
	void setUp() {
		host = member(HOST_ID, "testHost");
		otherMember = member(OTHER_ID, "other");
		lenient().when(memberRepository.getReferenceById(HOST_ID)).thenReturn(host);
		lenient().when(memberRepository.getReferenceById(OTHER_ID)).thenReturn(otherMember);
	}

	private Member member(Long id, String nickname) {
		Member member = Member.builder()
			.nickname(nickname)
			.build();
		ReflectionTestUtils.setField(member, "id", id);
		return member;
	}

	// ===== submitListing =====

	@Nested
	@DisplayName("숙소 등록 (submitListing)")
	class SubmitListing {

		@Test
		@DisplayName("유효한 요청으로 숙소를 등록하면 저장소에 저장된다")
		void savesListingToRepository() {
			// given
			ListingCreateRequest request = validCreateRequest();
			given(kakaoGeocodingService.reverseGeocode(anyDouble(), anyDouble())).willReturn(seoulGangnamRegion());
			given(listingRepository.save(any(Listing.class))).willAnswer(inv -> inv.getArgument(0));

			// when
			listingService.submitListing(HOST_ID, request);

			// then
			then(listingRepository).should(times(1)).save(any(Listing.class));
		}

		@Test
		@DisplayName("새로 등록된 숙소의 초기 상태는 PENDING이다")
		void newListingStateIsPending() {
			// given
			ListingCreateRequest request = validCreateRequest();
			given(kakaoGeocodingService.reverseGeocode(anyDouble(), anyDouble())).willReturn(seoulGangnamRegion());
			given(listingRepository.save(any(Listing.class))).willAnswer(inv -> {
				Listing saved = inv.getArgument(0);
				assertThat(saved.getState()).isEqualTo(ListingState.PENDING);
				return saved;
			});

			// when & then
			listingService.submitListing(HOST_ID, request);
		}

		@Test
		@DisplayName("한국 서비스 영역 밖의 좌표로 등록하면 INVALID_LOCATION 예외가 발생한다")
		void throwsExceptionWhenOutOfKoreanBounds() {
			// given - 도쿄 좌표
			ListingCreateRequest request = new ListingCreateRequest(
				"테스트 숙소", "도쿄도 신주쿠구 1", "101호", "16001",
				35.6895, 139.6917,
				RoomType.ENTIRE_PLACE, 2, 1, 1, 1, "설명",
				BigDecimal.valueOf(50000), Set.of()
			);

			// when & then
			assertThatThrownBy(() -> listingService.submitListing(HOST_ID, request))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.INVALID_LOCATION);

			then(kakaoGeocodingService).should(never()).reverseGeocode(anyDouble(), anyDouble());
		}
	}

	// ===== getHostListings =====

	@Nested
	@DisplayName("호스트 숙소 목록 조회 (getHostListings)")
	class GetHostListings {

		@Test
		@DisplayName("호스트의 숙소 목록을 HostListingsList로 반환한다")
		void returnsHostListingsList() {
			// given
			Listing listing1 = pendingListing(host);
			Listing listing2 = pendingListing(host);
			ReflectionTestUtils.setField(listing1, "id", 1L);
			ReflectionTestUtils.setField(listing2, "id", 2L);
			given(listingRepository.findAllByHost(host)).willReturn(List.of(listing1, listing2));

			// when
			HostListingsList result = listingService.getHostListings(HOST_ID);

			// then
			assertThat(result.listings()).hasSize(2);
			assertThat(result.listings()).extracting("id").containsExactly(1L, 2L);
		}

		@Test
		@DisplayName("등록된 숙소가 없으면 빈 목록을 반환한다")
		void returnsEmptyListWhenNoListings() {
			// given
			given(listingRepository.findAllByHost(host)).willReturn(List.of());

			// when
			HostListingsList result = listingService.getHostListings(HOST_ID);

			// then
			assertThat(result.listings()).isEmpty();
		}

		@Test
		@DisplayName("반환된 숙소 요약에 주소 요약이 '구, 시' 형식으로 포함된다")
		void listingSummaryContainsAddressSummary() {
			// given
			Listing listing = pendingListing(host);
			given(listingRepository.findAllByHost(host)).willReturn(List.of(listing));
			given(regionCodeService.getAddressSummary("11", "11680")).willReturn("강남구, 서울");

			// when
			HostListingsList result = listingService.getHostListings(HOST_ID);

			// then
			assertThat(result.listings().get(0).addressSummary()).isEqualTo("강남구, 서울");
		}
	}

	// ===== getListingDetail =====

	@Nested
	@DisplayName("숙소 상세 조회 (getListingDetail)")
	class GetListingDetail {

		@Test
		@DisplayName("본인 숙소 상세 조회 시 ListingDetail을 반환한다")
		void returnsListingDetail() {
			// given
			Listing listing = approvedListing(host);
			ReflectionTestUtils.setField(listing, "id", 1L);
			given(listingRepository.findById(1L)).willReturn(Optional.of(listing));

			// when
			ListingDetail result = listingService.getListingDetail(HOST_ID, 1L);

			// then
			assertThat(result.listingId()).isEqualTo(1L);
			assertThat(result.name()).isEqualTo("테스트 숙소");
			assertThat(result.hostName()).isEqualTo("testHost");
			assertThat(result.roomType()).isEqualTo(RoomType.ENTIRE_PLACE);
		}

		@Test
		@DisplayName("본인 소유가 아닌 숙소 조회 시 NOT_LISTING_OWNER 예외가 발생한다")
		void throwsExceptionWhenNotOwner() {
			// given
			Listing listing = approvedListing(host);
			given(listingRepository.findById(1L)).willReturn(Optional.of(listing));

			// when & then
			assertThatThrownBy(() -> listingService.getListingDetail(OTHER_ID, 1L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.NOT_LISTING_OWNER);
		}

		@Test
		@DisplayName("존재하지 않는 숙소 조회 시 INTERNAL_SERVER_ERROR 예외가 발생한다")
		void throwsExceptionWhenListingNotFound() {
			// given
			given(listingRepository.findById(99L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> listingService.getListingDetail(HOST_ID, 99L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}

	// ===== activate =====

	@Nested
	@DisplayName("숙소 활성화 (activate)")
	class Activate {

		@Test
		@DisplayName("APPROVED 상태의 본인 숙소를 활성화하면 상태가 APPROVED로 유지된다")
		void activatesApprovedListing() {
			// given
			Listing listing = approvedListing(host);
			given(listingRepository.findById(1L)).willReturn(Optional.of(listing));

			// when
			listingService.activate(HOST_ID, 1L);

			// then
			assertThat(listing.getState()).isEqualTo(ListingState.APPROVED);
		}

		@Test
		@DisplayName("본인 소유가 아닌 숙소 활성화 시 NOT_LISTING_OWNER 예외가 발생한다")
		void throwsExceptionWhenNotOwner() {
			// given
			Listing listing = approvedListing(host);
			given(listingRepository.findById(1L)).willReturn(Optional.of(listing));

			// when & then
			assertThatThrownBy(() -> listingService.activate(OTHER_ID, 1L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.NOT_LISTING_OWNER);
		}

		@Test
		@DisplayName("PENDING 상태의 숙소 활성화 시 LISTING_NOT_APPROVED 예외가 발생한다")
		void throwsExceptionWhenPending() {
			// given
			Listing listing = pendingListing(host);
			given(listingRepository.findById(1L)).willReturn(Optional.of(listing));

			// when & then
			assertThatThrownBy(() -> listingService.activate(HOST_ID, 1L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.LISTING_NOT_APPROVED);
		}

		@Test
		@DisplayName("INACTIVE 상태의 숙소 활성화 시 LISTING_NOT_APPROVED 예외가 발생한다")
		void throwsExceptionWhenInactive() {
			// given
			Listing listing = inactiveListing(host);
			given(listingRepository.findById(1L)).willReturn(Optional.of(listing));

			// when & then
			assertThatThrownBy(() -> listingService.activate(HOST_ID, 1L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.LISTING_NOT_APPROVED);
		}

		@Test
		@DisplayName("존재하지 않는 숙소 활성화 시 INTERNAL_SERVER_ERROR 예외가 발생한다")
		void throwsExceptionWhenListingNotFound() {
			// given
			given(listingRepository.findById(99L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> listingService.activate(HOST_ID, 99L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}

	// ===== deactivate =====

	@Nested
	@DisplayName("숙소 비활성화 (deactivate)")
	class Deactivate {

		@Test
		@DisplayName("APPROVED 상태의 본인 숙소를 비활성화하면 상태가 INACTIVE로 변경된다")
		void deactivatesApprovedListing() {
			// given
			Listing listing = approvedListing(host);
			given(listingRepository.findById(1L)).willReturn(Optional.of(listing));

			// when
			listingService.deactivate(HOST_ID, 1L);

			// then
			assertThat(listing.getState()).isEqualTo(ListingState.INACTIVE);
		}

		@Test
		@DisplayName("본인 소유가 아닌 숙소 비활성화 시 NOT_LISTING_OWNER 예외가 발생한다")
		void throwsExceptionWhenNotOwner() {
			// given
			Listing listing = approvedListing(host);
			given(listingRepository.findById(1L)).willReturn(Optional.of(listing));

			// when & then
			assertThatThrownBy(() -> listingService.deactivate(OTHER_ID, 1L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.NOT_LISTING_OWNER);
		}

		@Test
		@DisplayName("PENDING 상태의 숙소 비활성화 시 LISTING_NOT_APPROVED 예외가 발생한다")
		void throwsExceptionWhenPending() {
			// given
			Listing listing = pendingListing(host);
			given(listingRepository.findById(1L)).willReturn(Optional.of(listing));

			// when & then
			assertThatThrownBy(() -> listingService.deactivate(HOST_ID, 1L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.LISTING_NOT_APPROVED);
		}

		@Test
		@DisplayName("존재하지 않는 숙소 비활성화 시 INTERNAL_SERVER_ERROR 예외가 발생한다")
		void throwsExceptionWhenListingNotFound() {
			// given
			given(listingRepository.findById(99L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> listingService.deactivate(HOST_ID, 99L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}

	// ===== helpers =====

	private Listing pendingListing(Member owner) {
		return Listing.builder()
			.name("테스트 숙소")
			.roomType(RoomType.ENTIRE_PLACE)
			.description("설명")
			.address(seoulGangnamAddress())
			.host(owner)
			.capacity(new Capacity(2, 1, 1, 1))
			.pricePerNight(BigDecimal.valueOf(50000))
			.amenities(Set.of())
			.build();
	}

	private Listing approvedListing(Member owner) {
		Listing listing = pendingListing(owner);
		listing.activate();
		return listing;
	}

	private Listing inactiveListing(Member owner) {
		Listing listing = pendingListing(owner);
		ReflectionTestUtils.setField(listing, "state", ListingState.INACTIVE);
		return listing;
	}

	private ListingCreateRequest validCreateRequest() {
		return new ListingCreateRequest(
			"테스트 숙소", "서울 강남구 테헤란로 152", "101호", "06236",
			37.5012, 127.0396,
			RoomType.ENTIRE_PLACE, 2, 1, 1, 1, "설명",
			BigDecimal.valueOf(50000), Set.of()
		);
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

	private KakaoRegionInfo seoulGangnamRegion() {
		return new KakaoRegionInfo("11", "11680");
	}
}
