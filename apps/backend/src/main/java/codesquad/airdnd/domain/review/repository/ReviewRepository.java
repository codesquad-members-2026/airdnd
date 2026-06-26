package codesquad.airdnd.domain.review.repository;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import codesquad.airdnd.domain.review.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	boolean existsByReservation_ReservationId(Long reservationId);

	/**
	 * 커서 페이징: id 내림차순(=최신순, auto-increment라 유일)으로 cursor 미만을 size만큼 조회한다.
	 * 첫 페이지는 cursor에 Long.MAX_VALUE를 전달한다.
	 */
	@EntityGraph(attributePaths = "author")
	List<Review> findByReservation_Listing_IdAndIdLessThanOrderByIdDesc(
		Long listingId, Long cursor, Limit limit);
}
