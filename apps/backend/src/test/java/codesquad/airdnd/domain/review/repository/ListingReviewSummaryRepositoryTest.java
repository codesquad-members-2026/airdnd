package codesquad.airdnd.domain.review.repository;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import java.util.Set;

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
import codesquad.airdnd.domain.review.entity.ListingReviewSummary;

@DataJpaTest
class ListingReviewSummaryRepositoryTest {

	@Autowired
	private ListingReviewSummaryRepository repository;

	@Autowired
	private TestEntityManager em;

	@Test
	@DisplayName("버킷 증가 후 저장하면 리로드 시 개수와 평균이 유지된다")
	void persistsBucketsAndDerivedValues() {
		Member host = em.persist(Member.builder().nickname("host").build());
		Listing listing = em.persist(buildListing(host));
		em.flush();

		ListingReviewSummary summary = ListingReviewSummary.create(listing);
		summary.addRating(5);
		summary.addRating(4);
		summary.addRating(5);
		repository.save(summary);
		em.flush();
		em.clear();

		ListingReviewSummary found = repository.findById(listing.getId()).orElseThrow();
		assertThat(found.getReviewCount()).isEqualTo(3);
		assertThat(found.getAverageRating()).isEqualTo(14.0 / 3);
	}

	@Test
	@DisplayName("통계의 PK는 listing id를 공유한다 (@MapsId)")
	void sharesPrimaryKeyWithListing() {
		Member host = em.persist(Member.builder().nickname("host").build());
		Listing listing = em.persist(buildListing(host));
		em.flush();

		ListingReviewSummary summary = ListingReviewSummary.create(listing);
		repository.save(summary);
		em.flush();

		assertThat(summary.getListingId()).isEqualTo(listing.getId());
	}

	private Listing buildListing(Member owner) {
		return Listing.builder()
			.name("숙소")
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
