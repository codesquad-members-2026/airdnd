package codesquad.airdnd.domain.wishlist;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

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

import codesquad.airdnd.domain.listing.repository.ListingRepository;
import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.RoomType;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailItemQueryResult;
import codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailQueryResult;
import codesquad.airdnd.domain.wishlist.dto.request.ExistingWishlistAddRequest;
import codesquad.airdnd.domain.wishlist.dto.request.NewWishlistAddRequest;
import codesquad.airdnd.domain.wishlist.dto.request.WishlistItemPatchRequest;
import codesquad.airdnd.domain.wishlist.dto.request.WishlistPatchRequest;
import codesquad.airdnd.domain.wishlist.dto.response.ExistingWishlistAddResponse;
import codesquad.airdnd.domain.wishlist.dto.response.NewWishlistAddResponse;
import codesquad.airdnd.domain.wishlist.dto.response.WishlistDetailResponse;
import codesquad.airdnd.domain.wishlist.dto.response.WishlistItemPatchResponse;
import codesquad.airdnd.domain.wishlist.dto.response.WishlistPatchResponse;
import codesquad.airdnd.domain.wishlist.entity.Wishlist;
import codesquad.airdnd.domain.wishlistItem.WishlistItem;
import codesquad.airdnd.domain.wishlistItem.WishlistItemRepository;
import codesquad.airdnd.global.auth.AuthUtils;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

	@Mock
	private WishlistRepository wishlistRepository;

	@Mock
	private WishlistItemRepository wishlistItemRepository;

	@Mock
	private ListingRepository listingRepository;

	@Mock
	private AuthUtils authUtils;

	@InjectMocks
	private WishlistService wishlistService;

	private Member member;

	@BeforeEach
	void setUp() {
		member = Member.builder()
			.nickname("tester")
			.build();
		ReflectionTestUtils.setField(member, "id", 1L);
	}

	// ===== addItemInNewWishlist =====

	@Nested
	@DisplayName("새 위시리스트 생성 + 항목 추가 (addItemInNewWishlist)")
	class AddItemInNewWishlist {

		@Test
		@DisplayName("위시리스트를 저장하고 항목을 추가한 뒤 응답을 반환한다")
		void createsWishlistAndAddsItem() {
			// given
			NewWishlistAddRequest request = new NewWishlistAddRequest(10L, "제주 여행");
			Listing listing = listing(10L);
			given(authUtils.getCurrentMember()).willReturn(member);
			given(listingRepository.findById(10L)).willReturn(Optional.of(listing));
			given(wishlistItemRepository.existsByMemberIdAndListingId(1L, 10L)).willReturn(false);
			given(wishlistRepository.save(any(Wishlist.class))).willAnswer(inv -> {
				Wishlist saved = inv.getArgument(0);
				ReflectionTestUtils.setField(saved, "id", 100L);
				return saved;
			});

			// when
			NewWishlistAddResponse response = wishlistService.addItemInNewWishlist(request);

			// then
			assertThat(response.wishlistId()).isEqualTo(100L);
			assertThat(response.listingId()).isEqualTo(10L);
			assertThat(response.name()).isEqualTo("제주 여행");
			then(wishlistItemRepository).should(times(1)).save(any(WishlistItem.class));
		}

		@Test
		@DisplayName("존재하지 않는 숙소면 LISTING_NOT_FOUND 예외가 발생한다")
		void throwsWhenListingNotFound() {
			// given
			NewWishlistAddRequest request = new NewWishlistAddRequest(99L, "이름");
			given(authUtils.getCurrentMember()).willReturn(member);
			given(listingRepository.findById(99L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> wishlistService.addItemInNewWishlist(request))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.LISTING_NOT_FOUND);
			then(wishlistRepository).should(never()).save(any());
			then(wishlistItemRepository).should(never()).save(any());
		}

		@Test
		@DisplayName("이미 위시리스트에 담긴 숙소면 WISHLIST_ITEM_ALREADY_EXISTS 예외가 발생한다")
		void throwsWhenAlreadyExists() {
			// given
			NewWishlistAddRequest request = new NewWishlistAddRequest(10L, "이름");
			given(authUtils.getCurrentMember()).willReturn(member);
			given(listingRepository.findById(10L)).willReturn(Optional.of(listing(10L)));
			given(wishlistItemRepository.existsByMemberIdAndListingId(1L, 10L)).willReturn(true);

			// when & then
			assertThatThrownBy(() -> wishlistService.addItemInNewWishlist(request))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.WISHLIST_ITEM_ALREADY_EXISTS);
			then(wishlistRepository).should(never()).save(any());
			then(wishlistItemRepository).should(never()).save(any());
		}
	}

	// ===== addItemInExistingWishlist =====

	@Nested
	@DisplayName("기존 위시리스트에 항목 추가 (addItemInExistingWishlist)")
	class AddItemInExistingWishlist {

		@Test
		@DisplayName("기존 위시리스트에 항목을 추가하고 응답을 반환한다")
		void addsItemToExistingWishlist() {
			// given
			ExistingWishlistAddRequest request = new ExistingWishlistAddRequest(10L);
			Listing listing = listing(10L);
			Wishlist wishlist = wishlist(5L, "기존 위시리스트");
			given(authUtils.getCurrentMember()).willReturn(member);
			given(listingRepository.findById(10L)).willReturn(Optional.of(listing));
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.of(wishlist));
			given(wishlistItemRepository.existsByMemberIdAndListingId(1L, 10L)).willReturn(false);

			// when
			ExistingWishlistAddResponse response = wishlistService.addItemInExistingWishlist(5L, request);

			// then
			assertThat(response.wishlistId()).isEqualTo(5L);
			assertThat(response.listingId()).isEqualTo(10L);
			assertThat(response.name()).isEqualTo("기존 위시리스트");
			then(wishlistItemRepository).should(times(1)).save(any(WishlistItem.class));
		}

		@Test
		@DisplayName("존재하지 않는 숙소면 LISTING_NOT_FOUND 예외가 발생한다")
		void throwsWhenListingNotFound() {
			// given
			ExistingWishlistAddRequest request = new ExistingWishlistAddRequest(99L);
			given(authUtils.getCurrentMember()).willReturn(member);
			given(listingRepository.findById(99L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> wishlistService.addItemInExistingWishlist(5L, request))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.LISTING_NOT_FOUND);
		}

		@Test
		@DisplayName("본인 소유 위시리스트가 아니면 WISHLIST_NOT_FOUND 예외가 발생한다")
		void throwsWhenWishlistNotOwned() {
			// given
			ExistingWishlistAddRequest request = new ExistingWishlistAddRequest(10L);
			given(authUtils.getCurrentMember()).willReturn(member);
			given(listingRepository.findById(10L)).willReturn(Optional.of(listing(10L)));
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> wishlistService.addItemInExistingWishlist(5L, request))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.WISHLIST_NOT_FOUND);
			then(wishlistItemRepository).should(never()).save(any());
		}

		@Test
		@DisplayName("이미 담긴 숙소면 WISHLIST_ITEM_ALREADY_EXISTS 예외가 발생한다")
		void throwsWhenAlreadyExists() {
			// given
			ExistingWishlistAddRequest request = new ExistingWishlistAddRequest(10L);
			given(authUtils.getCurrentMember()).willReturn(member);
			given(listingRepository.findById(10L)).willReturn(Optional.of(listing(10L)));
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.of(wishlist(5L, "위시리스트")));
			given(wishlistItemRepository.existsByMemberIdAndListingId(1L, 10L)).willReturn(true);

			// when & then
			assertThatThrownBy(() -> wishlistService.addItemInExistingWishlist(5L, request))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.WISHLIST_ITEM_ALREADY_EXISTS);
			then(wishlistItemRepository).should(never()).save(any());
		}
	}

	// ===== deleteWishlist =====

	@Nested
	@DisplayName("위시리스트 삭제 (deleteWishlist)")
	class DeleteWishlist {

		@Test
		@DisplayName("본인 위시리스트를 삭제한다")
		void deletesWishlist() {
			// given
			Wishlist wishlist = wishlist(5L, "삭제될 위시리스트");
			given(authUtils.getCurrentMember()).willReturn(member);
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.of(wishlist));

			// when
			wishlistService.deleteWishlist(5L);

			// then
			then(wishlistRepository).should(times(1)).delete(wishlist);
		}

		@Test
		@DisplayName("본인 소유가 아니면 WISHLIST_NOT_FOUND 예외가 발생한다")
		void throwsWhenNotOwned() {
			// given
			given(authUtils.getCurrentMember()).willReturn(member);
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> wishlistService.deleteWishlist(5L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.WISHLIST_NOT_FOUND);
			then(wishlistRepository).should(never()).delete(any());
		}
	}

	// ===== deleteItemInWishlist =====

	@Nested
	@DisplayName("위시리스트 항목 삭제 (deleteItemInWishlist)")
	class DeleteItemInWishlist {

		@Test
		@DisplayName("위시리스트에서 항목을 삭제한다")
		void deletesItem() {
			// given
			Wishlist wishlist = wishlist(5L, "위시리스트");
			WishlistItem item = wishlistItem(wishlist, listing(10L), "메모");
			given(authUtils.getCurrentMember()).willReturn(member);
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.of(wishlist));
			given(wishlistItemRepository.findByWishlist_IdAndListing_Id(5L, 10L)).willReturn(Optional.of(item));

			// when
			wishlistService.deleteItemInWishlist(5L, 10L);

			// then
			then(wishlistItemRepository).should(times(1)).delete(item);
		}

		@Test
		@DisplayName("본인 소유 위시리스트가 아니면 WISHLIST_NOT_FOUND 예외가 발생한다")
		void throwsWhenWishlistNotOwned() {
			// given
			given(authUtils.getCurrentMember()).willReturn(member);
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> wishlistService.deleteItemInWishlist(5L, 10L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.WISHLIST_NOT_FOUND);
			then(wishlistItemRepository).should(never()).delete(any());
		}

		@Test
		@DisplayName("위시리스트에 없는 항목이면 WISHLIST_ITEM_NOT_FOUND 예외가 발생한다")
		void throwsWhenItemNotFound() {
			// given
			Wishlist wishlist = wishlist(5L, "위시리스트");
			given(authUtils.getCurrentMember()).willReturn(member);
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.of(wishlist));
			given(wishlistItemRepository.findByWishlist_IdAndListing_Id(5L, 10L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> wishlistService.deleteItemInWishlist(5L, 10L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.WISHLIST_ITEM_NOT_FOUND);
			then(wishlistItemRepository).should(never()).delete(any());
		}
	}

	// ===== patchWishlist =====

	@Nested
	@DisplayName("위시리스트 이름 변경 (patchWishlist)")
	class PatchWishlist {

		@Test
		@DisplayName("이름을 변경하고 변경된 이름을 응답으로 반환한다")
		void updatesName() {
			// given
			Wishlist wishlist = wishlist(5L, "옛 이름");
			given(authUtils.getCurrentMember()).willReturn(member);
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.of(wishlist));

			// when
			WishlistPatchResponse response = wishlistService.patchWishlist(5L, new WishlistPatchRequest("새 이름"));

			// then
			assertThat(response.id()).isEqualTo(5L);
			assertThat(response.name()).isEqualTo("새 이름");
			assertThat(wishlist.getName()).isEqualTo("새 이름");
		}

		@Test
		@DisplayName("본인 소유가 아니면 WISHLIST_NOT_FOUND 예외가 발생한다")
		void throwsWhenNotOwned() {
			// given
			given(authUtils.getCurrentMember()).willReturn(member);
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> wishlistService.patchWishlist(5L, new WishlistPatchRequest("새 이름")))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.WISHLIST_NOT_FOUND);
		}
	}

	// ===== patchItemInWishlist =====

	@Nested
	@DisplayName("위시리스트 항목 메모 변경 (patchItemInWishlist)")
	class PatchItemInWishlist {

		@Test
		@DisplayName("메모를 변경하고 변경된 메모를 응답으로 반환한다")
		void updatesNote() {
			// given
			Wishlist wishlist = wishlist(5L, "위시리스트");
			WishlistItem item = wishlistItem(wishlist, listing(10L), "옛 메모");
			given(authUtils.getCurrentMember()).willReturn(member);
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.of(wishlist));
			given(wishlistItemRepository.findByWishlist_IdAndListing_Id(5L, 10L)).willReturn(Optional.of(item));

			// when
			WishlistItemPatchResponse response =
				wishlistService.patchItemInWishlist(5L, 10L, new WishlistItemPatchRequest("새 메모"));

			// then
			assertThat(response.wishlistId()).isEqualTo(5L);
			assertThat(response.listingId()).isEqualTo(10L);
			assertThat(response.note()).isEqualTo("새 메모");
			assertThat(item.getNote()).isEqualTo("새 메모");
		}

		@Test
		@DisplayName("빈 메모로도 변경할 수 있다")
		void updatesNoteToEmpty() {
			// given
			Wishlist wishlist = wishlist(5L, "위시리스트");
			WishlistItem item = wishlistItem(wishlist, listing(10L), "옛 메모");
			given(authUtils.getCurrentMember()).willReturn(member);
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.of(wishlist));
			given(wishlistItemRepository.findByWishlist_IdAndListing_Id(5L, 10L)).willReturn(Optional.of(item));

			// when
			WishlistItemPatchResponse response =
				wishlistService.patchItemInWishlist(5L, 10L, new WishlistItemPatchRequest(""));

			// then
			assertThat(response.note()).isEmpty();
			assertThat(item.getNote()).isEmpty();
		}

		@Test
		@DisplayName("위시리스트에 없는 항목이면 WISHLIST_ITEM_NOT_FOUND 예외가 발생한다")
		void throwsWhenItemNotFound() {
			// given
			Wishlist wishlist = wishlist(5L, "위시리스트");
			given(authUtils.getCurrentMember()).willReturn(member);
			given(wishlistRepository.findByIdAndMember_Id(5L, 1L)).willReturn(Optional.of(wishlist));
			given(wishlistItemRepository.findByWishlist_IdAndListing_Id(5L, 10L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> wishlistService.patchItemInWishlist(5L, 10L, new WishlistItemPatchRequest("메모")))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.WISHLIST_ITEM_NOT_FOUND);
		}
	}

	// ===== getWishlist =====

	@Nested
	@DisplayName("위시리스트 상세 조회 (getWishlist)")
	class GetWishlist {

		@Test
		@DisplayName("항목 + 메모 + 이미지를 조립해 상세 응답을 반환한다")
		void assemblesDetail() {
			// given - 위시리스트(id=1, '여행')에 listing 10(메모O, 이미지 2장), listing 20(메모X, 이미지X)
			given(wishlistRepository.findDetail(1L)).willReturn(List.of(
				new WishlistDetailQueryResult(1L, "여행", "메모A", 10L),
				new WishlistDetailQueryResult(1L, "여행", null, 20L)
			));
			given(wishlistRepository.findDetailItem(List.of(10L, 20L))).willReturn(List.of(
				new WishlistDetailItemQueryResult(10L, "숙소10", BigDecimal.valueOf(50000), "img10a"),
				new WishlistDetailItemQueryResult(10L, "숙소10", BigDecimal.valueOf(50000), "img10b"),
				new WishlistDetailItemQueryResult(20L, "숙소20", BigDecimal.valueOf(70000), null)
			));

			// when
			WishlistDetailResponse response = wishlistService.getWishlist(1L);

			// then
			assertThat(response.id()).isEqualTo(1L);
			assertThat(response.name()).isEqualTo("여행");
			assertThat(response.items()).hasSize(2);

			assertThat(response.items().get(0).listingId()).isEqualTo(10L);
			assertThat(response.items().get(0).listingName()).isEqualTo("숙소10");
			assertThat(response.items().get(0).pricePerNight()).isEqualByComparingTo(BigDecimal.valueOf(50000));
			assertThat(response.items().get(0).note()).isEqualTo("메모A");
			assertThat(response.items().get(0).imageUrls()).containsExactly("img10a", "img10b");

			assertThat(response.items().get(1).listingId()).isEqualTo(20L);
			assertThat(response.items().get(1).note()).isNull();
			assertThat(response.items().get(1).imageUrls()).isEmpty();
		}

		@Test
		@DisplayName("항목이 없는 빈 위시리스트는 빈 items로 반환하고 항목 조회를 호출하지 않는다")
		void returnsEmptyItemsForEmptyWishlist() {
			// given - 항목 없는 위시리스트는 listingId가 null인 단일 행으로 조회된다
			given(wishlistRepository.findDetail(2L)).willReturn(List.of(
				new WishlistDetailQueryResult(2L, "빈 위시리스트", null, null)
			));

			// when
			WishlistDetailResponse response = wishlistService.getWishlist(2L);

			// then
			assertThat(response.id()).isEqualTo(2L);
			assertThat(response.name()).isEqualTo("빈 위시리스트");
			assertThat(response.items()).isEmpty();
			then(wishlistRepository).should(never()).findDetailItem(any());
		}

		@Test
		@DisplayName("존재하지 않는 위시리스트면 WISHLIST_NOT_FOUND 예외가 발생한다")
		void throwsWhenNotFound() {
			// given
			given(wishlistRepository.findDetail(99L)).willReturn(List.of());

			// when & then
			assertThatThrownBy(() -> wishlistService.getWishlist(99L))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.WISHLIST_NOT_FOUND);
		}
	}

	// ===== helpers =====

	private Wishlist wishlist(Long id, String name) {
		Wishlist wishlist = Wishlist.builder()
			.member(member)
			.name(name)
			.build();
		ReflectionTestUtils.setField(wishlist, "id", id);
		return wishlist;
	}

	private WishlistItem wishlistItem(Wishlist wishlist, Listing listing, String note) {
		WishlistItem item = WishlistItem.builder()
			.wishlist(wishlist)
			.listing(listing)
			.note(note)
			.build();
		ReflectionTestUtils.setField(item.getId(), "wishlistId", wishlist.getId());
		ReflectionTestUtils.setField(item.getId(), "listingId", listing.getId());
		return item;
	}

	private Listing listing(Long id) {
		Listing listing = Listing.builder()
			.name("숙소" + id)
			.roomType(RoomType.ENTIRE_PLACE)
			.description("설명")
			.address(new Address("서울 강남구 테헤란로 152", "101호", "06236",
				point(37.5012, 127.0396), "11", "11680"))
			.host(member)
			.capacity(new Capacity(2, 1, 1, 1))
			.pricePerNight(BigDecimal.valueOf(50000))
			.amenities(Set.of())
			.build();
		ReflectionTestUtils.setField(listing, "id", id);
		return listing;
	}

	private Point point(double lat, double lng) {
		return new GeometryFactory().createPoint(new Coordinate(lng, lat));
	}
}
