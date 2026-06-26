package codesquad.airdnd.domain.wishlist;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.ListingImage;
import codesquad.airdnd.domain.listing.entity.RoomType;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailItemQueryResult;
import codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailQueryResult;
import codesquad.airdnd.domain.wishlist.entity.Wishlist;
import codesquad.airdnd.domain.wishlistItem.WishlistItem;

@DataJpaTest
class WishlistRepositoryTest {

	@Autowired
	private WishlistRepository wishlistRepository;

	@Autowired
	private TestEntityManager em;

	private Member member;
	private Member otherMember;

	@BeforeEach
	void setUp() {
		member = em.persist(Member.builder().nickname("owner").build());
		otherMember = em.persist(Member.builder().nickname("other").build());
		em.flush();
	}

	// TODO: 위시리스트 목록 분할 쿼리 @DataJpaTest 커버리지 추가 필요.
	//  findWishlistSummaries / findCoverImages 는 네이티브 CTE + ROW_NUMBER + 인터페이스
	//  프로젝션이라 컴파일·서비스 목 테스트로는 실제 실행이 검증되지 않음. 실DB로 확인할 케이스:
	//  - 빈 위시리스트 -> coverListingId = null
	//  - 아이템 N개 -> itemCount = N
	//  - 대표 이미지 = 가장 낮은 sort_order
	//  - findCoverImages 의 listing_id IN (:ids) 매핑

	// ===== findByIdAndMember_Id =====

	@Test
	@DisplayName("본인 소유의 위시리스트를 조회한다")
	void findByIdAndMember_Id_returnsOwnWishlist() {
		// given
		Wishlist wishlist = em.persist(Wishlist.builder().member(member).name("내 위시리스트").build());
		em.flush();

		// when
		Optional<Wishlist> found = wishlistRepository.findByIdAndMember_Id(wishlist.getId(), member.getId());

		// then
		assertThat(found).isPresent();
		assertThat(found.get().getName()).isEqualTo("내 위시리스트");
	}

	@Test
	@DisplayName("다른 회원의 위시리스트는 조회되지 않는다")
	void findByIdAndMember_Id_doesNotReturnOthers() {
		// given
		Wishlist wishlist = em.persist(Wishlist.builder().member(member).name("내 위시리스트").build());
		em.flush();

		// when
		Optional<Wishlist> found = wishlistRepository.findByIdAndMember_Id(wishlist.getId(), otherMember.getId());

		// then
		assertThat(found).isEmpty();
	}

	// ===== findDetail =====

	@Test
	@DisplayName("위시리스트의 각 항목을 (id, name, note, listingId) 행으로 반환한다")
	void findDetail_returnsRowPerItem() {
		// given
		Wishlist wishlist = em.persist(Wishlist.builder().member(member).name("여행").build());
		Listing listingA = em.persist(buildListing("숙소A", member));
		Listing listingB = em.persist(buildListing("숙소B", member));
		em.persist(WishlistItem.builder().wishlist(wishlist).listing(listingA).note("메모A").build());
		em.persist(WishlistItem.builder().wishlist(wishlist).listing(listingB).build());
		em.flush();

		// when
		List<WishlistDetailQueryResult> result = wishlistRepository.findDetail(wishlist.getId());

		// then
		assertThat(result).hasSize(2);
		assertThat(result).allSatisfy(row -> {
			assertThat(row.id()).isEqualTo(wishlist.getId());
			assertThat(row.name()).isEqualTo("여행");
		});
		assertThat(result).extracting(WishlistDetailQueryResult::listingId)
			.containsExactlyInAnyOrder(listingA.getId(), listingB.getId());
		assertThat(result).extracting(WishlistDetailQueryResult::note)
			.containsExactlyInAnyOrder("메모A", null);
	}

	@Test
	@DisplayName("항목이 없는 위시리스트는 listingId가 null인 단일 행을 반환한다")
	void findDetail_emptyWishlistReturnsSingleNullRow() {
		// given
		Wishlist wishlist = em.persist(Wishlist.builder().member(member).name("빈 위시리스트").build());
		em.flush();

		// when
		List<WishlistDetailQueryResult> result = wishlistRepository.findDetail(wishlist.getId());

		// then
		assertThat(result).hasSize(1);
		assertThat(result.get(0).id()).isEqualTo(wishlist.getId());
		assertThat(result.get(0).name()).isEqualTo("빈 위시리스트");
		assertThat(result.get(0).listingId()).isNull();
		assertThat(result.get(0).note()).isNull();
	}

	@Test
	@DisplayName("존재하지 않는 위시리스트는 빈 목록을 반환한다")
	void findDetail_notFoundReturnsEmpty() {
		// when
		List<WishlistDetailQueryResult> result = wishlistRepository.findDetail(999L);

		// then
		assertThat(result).isEmpty();
	}

	// ===== findDetailItem =====

	@Test
	@DisplayName("숙소 정보와 이미지를 sortOrder 순으로 반환한다")
	void findDetailItem_returnsListingInfoWithImagesOrdered() {
		// given
		Listing listing = em.persist(buildListing("숙소", member));
		em.persist(listingImage(listing, "second", 2));
		em.persist(listingImage(listing, "first", 1));
		em.flush();

		// when
		List<WishlistDetailItemQueryResult> result =
			wishlistRepository.findDetailItem(List.of(listing.getId()));

		// then
		assertThat(result).hasSize(2);
		assertThat(result).extracting(WishlistDetailItemQueryResult::imageUrl)
			.containsExactly("first", "second");
		assertThat(result.get(0).listingId()).isEqualTo(listing.getId());
		assertThat(result.get(0).listingName()).isEqualTo("숙소");
		assertThat(result.get(0).pricePerNight()).isEqualByComparingTo(BigDecimal.valueOf(50000));
	}

	@Test
	@DisplayName("이미지가 없는 숙소는 imageUrl이 null인 단일 행을 반환한다")
	void findDetailItem_noImageReturnsNullImageRow() {
		// given
		Listing listing = em.persist(buildListing("이미지 없는 숙소", member));
		em.flush();

		// when
		List<WishlistDetailItemQueryResult> result =
			wishlistRepository.findDetailItem(List.of(listing.getId()));

		// then
		assertThat(result).hasSize(1);
		assertThat(result.get(0).imageUrl()).isNull();
		assertThat(result.get(0).listingName()).isEqualTo("이미지 없는 숙소");
	}

	// ===== helper =====

	private Listing buildListing(String name, Member owner) {
		return Listing.builder()
			.name(name)
			.roomType(RoomType.ENTIRE_PLACE)
			.description("설명")
			.address(new Address("서울 강남구 테헤란로 152", "101호", "06236",
				point(37.5012, 127.0396), "11", "11680"))
			.host(owner)
			.capacity(new Capacity(2, 1, 1, 1))
			.pricePerNight(BigDecimal.valueOf(50000))
			.amenities(Set.of())
			.build();
	}

	private Point point(double lat, double lng) {
		return new GeometryFactory().createPoint(new Coordinate(lng, lat));
	}

	private ListingImage listingImage(Listing listing, String imageUrl, int sortOrder) {
		ListingImage image = ListingImage.builder().imageUrl(imageUrl).sortOrder(sortOrder).build();
		image.assignListing(listing);
		return image;
	}
}
