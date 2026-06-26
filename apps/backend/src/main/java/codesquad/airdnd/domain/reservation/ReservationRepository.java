package codesquad.airdnd.domain.reservation;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import codesquad.airdnd.domain.reservation.entity.Reservation;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Optional<Reservation> findByReservationIdAndGuest_Id(Long resId, Long memberId);

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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reservation r where r.reservationId = :id and r.guest.id = :gid")
    Optional<Reservation> findForUpdate(Long id, Long gid);
}
