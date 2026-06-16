package codesquad.airdnd.domain.listing;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import java.util.List;
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

@DataJpaTest
class ListingRepositoryTest {

	@Autowired
	private ListingRepository listingRepository;

	@Autowired
	private TestEntityManager em;

	private Member host;
	private Member otherHost;

	@BeforeEach
	void setUp() {
		host = em.persist(Member.builder()
			.nickname("testHost")
			.build());
		otherHost = em.persist(Member.builder()
			.nickname("otherHost")
			.build());
		em.flush();
	}

	@Test
	@DisplayName("호스트 본인의 숙소만 반환한다")
	void findAllByHost_returnsOnlyOwnListings() {
		// given
		em.persist(buildListing("내 숙소 A", host));
		em.persist(buildListing("내 숙소 B", host));
		em.persist(buildListing("다른 호스트 숙소", otherHost));
		em.flush();

		// when
		List<Listing> result = listingRepository.findAllByHost(host);

		// then
		assertThat(result).hasSize(2);
		assertThat(result).extracting(Listing::getName)
			.containsExactlyInAnyOrder("내 숙소 A", "내 숙소 B");
	}

	@Test
	@DisplayName("다른 호스트의 숙소는 반환되지 않는다")
	void findAllByHost_doesNotReturnOtherHostListings() {
		// given
		em.persist(buildListing("다른 호스트 숙소", otherHost));
		em.flush();

		// when
		List<Listing> result = listingRepository.findAllByHost(host);

		// then
		assertThat(result).isEmpty();
	}

	@Test
	@DisplayName("등록된 숙소가 없으면 빈 목록을 반환한다")
	void findAllByHost_returnsEmptyListWhenNoListings() {
		// when
		List<Listing> result = listingRepository.findAllByHost(host);

		// then
		assertThat(result).isEmpty();
	}

	@Test
	@DisplayName("숙소가 여러 개 있어도 호스트 ID 기준으로 정확히 필터링된다")
	void findAllByHost_filtersAccuratelyByHostId() {
		// given
		em.persist(buildListing("호스트 A 숙소 1", host));
		em.persist(buildListing("호스트 B 숙소 1", otherHost));
		em.persist(buildListing("호스트 B 숙소 2", otherHost));
		em.flush();

		// when
		List<Listing> hostResult = listingRepository.findAllByHost(host);
		List<Listing> otherResult = listingRepository.findAllByHost(otherHost);

		// then
		assertThat(hostResult).hasSize(1);
		assertThat(otherResult).hasSize(2);
	}

	@Test
	@DisplayName("숙소를 저장하면 이미지도 함께 저장되고 listing_id가 채워진다")
	void save_cascadesImagesWithListingId() {
		// given
		Listing listing = buildListingWithImages("이미지 숙소", host, List.of("url1", "url2", "url3"));

		// when
		Listing saved = listingRepository.save(listing);
		em.flush();
		em.clear();

		// then
		Listing found = listingRepository.findById(saved.getId()).orElseThrow();
		assertThat(found.getImages()).hasSize(3);
		assertThat(found.getImages())
			.allSatisfy(image -> assertThat(image.getListing().getId()).isEqualTo(found.getId()));
		assertThat(found.getImages())
			.extracting(ListingImage::getSortOrder)
			.containsExactly(0, 1, 2);
	}

	@Test
	@DisplayName("이미지를 컬렉션에서 제거하면 orphanRemoval로 삭제된다")
	void removeImage_deletesOrphan() {
		// given
		Listing listing = buildListingWithImages("이미지 숙소", host, List.of("url1", "url2", "url3"));
		Listing saved = listingRepository.save(listing);
		em.flush();

		// when
		saved.getImages().remove(0);
		em.flush();
		em.clear();

		// then
		Listing found = listingRepository.findById(saved.getId()).orElseThrow();
		assertThat(found.getImages()).hasSize(2);
	}

	// ===== helper =====

	private Listing buildListingWithImages(String name, Member owner, List<String> imageUrls) {
		return Listing.builder()
			.name(name)
			.roomType(RoomType.ENTIRE_PLACE)
			.description("설명")
			.address(new Address("서울 강남구 테헤란로 152", "101호", "06236",
				point(37.5012, 127.0396),
				"11", "11680"))
			.host(owner)
			.capacity(new Capacity(2, 1, 1, 1))
			.pricePerNight(BigDecimal.valueOf(50000))
			.amenities(Set.of())
			.images(ListingImage.from(imageUrls))
			.build();
	}

	private Listing buildListing(String name, Member owner) {
		return Listing.builder()
			.name(name)
			.roomType(RoomType.ENTIRE_PLACE)
			.description("설명")
			.address(new Address("서울 강남구 테헤란로 152", "101호", "06236",
				point(37.5012, 127.0396),
				"11", "11680"))
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
