package codesquad.airdnd.domain.reservation;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import codesquad.airdnd.domain.reservation.entity.Reservation;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
	@Query("""
				SELECT r FROM Reservation r
					JOIN FETCH r.listing
					WHERE r.guest.id = :userId
						AND r.checkOutDate >= :now
					ORDER BY r.checkInDate ASC
		""")
	List<Reservation> findUpcoming(Long userId, LocalDate now);

	@Query("""
				SELECT r
				FROM Reservation r
					JOIN FETCH r.listing l
					JOIN FETCH l.host
					JOIN FETCH r.guest
				WHERE r.reservationId = :id
		""")
	Optional<Reservation> findDetailById(Long id);
}
