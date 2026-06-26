package codesquad.airdnd.domain.review.repository;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Limit;
import org.springframework.test.util.ReflectionTestUtils;

import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.RoomType;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.reservation.entity.GuestCounts;
import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.domain.reservation.entity.ReservationState;
import codesquad.airdnd.domain.review.entity.Review;

@DataJpaTest
class ReviewRepositoryTest {

	@Autowired
	private ReviewRepository reviewRepository;

	@Autowired
	private TestEntityManager em;

	@Test
	@DisplayName("커서(id) 내림차순으로 특정 숙소 리뷰를 작성자와 함께 페이징한다")
	void findsReviewsByCursorDesc() {
		Member guest = em.persist(Member.builder().nickname("게스트1").profileUrl("p1.png").build());
		Listing listingA = em.persist(buildListing(guest));
		Listing listingB = em.persist(buildListing(guest));
		em.flush();

		Review r1 = persistReview(guest, listingA, 5, "리뷰1");
		Review r2 = persistReview(guest, listingA, 4, "리뷰2");
		Review r3 = persistReview(guest, listingA, 3, "리뷰3");
		persistReview(guest, listingB, 2, "다른 숙소");
		em.flush();
		em.clear();

		List<Review> first = reviewRepository
			.findByReservation_Listing_IdAndIdLessThanOrderByIdDesc(listingA.getId(), Long.MAX_VALUE, Limit.of(2));

		assertThat(first).extracting(Review::getId).containsExactly(r3.getId(), r2.getId());
		assertThat(first.get(0).getAuthor().getNickname()).isEqualTo("게스트1");

		List<Review> next = reviewRepository
			.findByReservation_Listing_IdAndIdLessThanOrderByIdDesc(listingA.getId(), r2.getId(), Limit.of(2));

		assertThat(next).extracting(Review::getId).containsExactly(r1.getId());
	}

	private Review persistReview(Member guest, Listing listing, int rating, String content) {
		Reservation reservation = Reservation.create(
			guest, listing, LocalDate.now(), LocalDate.now().plusDays(1), GuestCounts.create(1, 0, 0, 0));
		ReflectionTestUtils.setField(reservation, "state", ReservationState.COMPLETED);
		em.persist(reservation);
		Review review = Review.create(reservation, guest, rating, content);
		em.persist(review);
		return review;
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
