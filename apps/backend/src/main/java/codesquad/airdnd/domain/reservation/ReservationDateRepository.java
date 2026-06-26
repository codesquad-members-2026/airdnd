package codesquad.airdnd.domain.reservation;

import org.springframework.data.jpa.repository.JpaRepository;

import codesquad.airdnd.domain.reservation.entity.ReservationDate;

public interface ReservationDateRepository extends JpaRepository<ReservationDate, Long> {
	void deleteByReservationId(Long reservationId);
}
