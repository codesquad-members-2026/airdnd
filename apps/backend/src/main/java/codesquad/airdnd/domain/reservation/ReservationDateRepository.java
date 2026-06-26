package codesquad.airdnd.domain.reservation;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import codesquad.airdnd.domain.reservation.entity.ReservationDate;

public interface ReservationDateRepository extends JpaRepository<ReservationDate, Long> {
	void deleteByReservationId(Long reservationId);

	@Query("select rd.stayDate from ReservationDate rd "
		+ "where rd.listingId = :listingId and rd.stayDate between :from and :to "
		+ "order by rd.stayDate")
	List<LocalDate> findStayDates(
		@Param("listingId") Long listingId,
		@Param("from") LocalDate from,
		@Param("to") LocalDate to
	);
}
