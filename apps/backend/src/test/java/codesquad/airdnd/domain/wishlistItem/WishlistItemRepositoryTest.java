package codesquad.airdnd.domain.wishlistItem;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
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
import codesquad.airdnd.domain.listing.entity.RoomType;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.wishlist.entity.Wishlist;

@DataJpaTest
class WishlistItemRepositoryTest {

	@Autowired
	private WishlistItemRepository wishlistItemRepository;

	@Autowired
	private TestEntityManager em;

	private Member member;
	private Member otherMember;
	private Listing listing;
	private Wishlist wishlist;

	@BeforeEach
	void setUp() {
		member = em.persist(Member.builder().nickname("owner").build());
		otherMember = em.persist(Member.builder().nickname("other").build());
		listing = em.persist(buildListing("숙소", member));
		wishlist = em.persist(Wishlist.builder().member(member).name("내 위시리스트").build());
		em.flush();
	}

	@Test
	@DisplayName("회원이 해당 숙소를 위시리스트에 담았으면 true를 반환한다")
	void existsByMemberIdAndListingId_true() {
		// given
		em.persist(WishlistItem.builder().wishlist(wishlist).listing(listing).build());
		em.flush();

		// when
		boolean exists = wishlistItemRepository.existsByMemberIdAndListingId(member.getId(), listing.getId());

		// then
		assertThat(exists).isTrue();
	}

	@Test
	@DisplayName("담지 않은 숙소면 false를 반환한다")
	void existsByMemberIdAndListingId_false() {
		// when
		boolean exists = wishlistItemRepository.existsByMemberIdAndListingId(member.getId(), listing.getId());

		// then
		assertThat(exists).isFalse();
	}

	@Test
	@DisplayName("다른 회원이 담은 숙소는 해당 회원 기준으로 false를 반환한다")
	void existsByMemberIdAndListingId_scopedToMember() {
		// given - member 가 담았지만 otherMember 기준으로 조회
		em.persist(WishlistItem.builder().wishlist(wishlist).listing(listing).build());
		em.flush();

		// when
		boolean exists = wishlistItemRepository.existsByMemberIdAndListingId(otherMember.getId(), listing.getId());

		// then
		assertThat(exists).isFalse();
	}

	@Test
	@DisplayName("위시리스트 id와 숙소 id로 항목을 조회한다")
	void findByWishlist_IdAndListing_Id_present() {
		// given
		em.persist(WishlistItem.builder().wishlist(wishlist).listing(listing).note("메모").build());
		em.flush();
		em.clear();

		// when
		Optional<WishlistItem> found =
			wishlistItemRepository.findByWishlist_IdAndListing_Id(wishlist.getId(), listing.getId());

		// then
		assertThat(found).isPresent();
		assertThat(found.get().getNote()).isEqualTo("메모");
		assertThat(found.get().getId().getWishlistId()).isEqualTo(wishlist.getId());
		assertThat(found.get().getId().getListingId()).isEqualTo(listing.getId());
	}

	@Test
	@DisplayName("항목이 없으면 빈 Optional을 반환한다")
	void findByWishlist_IdAndListing_Id_empty() {
		// when
		Optional<WishlistItem> found =
			wishlistItemRepository.findByWishlist_IdAndListing_Id(wishlist.getId(), listing.getId());

		// then
		assertThat(found).isEmpty();
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
}
