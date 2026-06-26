package codesquad.airdnd.domain.reservation.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(
	name = "uq_listing_date",
	columnNames = {"listing_id", "stay_date"}
))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReservationDate {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long listingId;

	@Column(nullable = false)
	private LocalDate stayDate;

	@Column(nullable = false)
	private Long reservationId;

	private ReservationDate(Long listingId, LocalDate stayDate, Long reservationId) {
		this.listingId = listingId;
		this.stayDate = stayDate;
		this.reservationId = reservationId;
	}

	public static List<ReservationDate> from(Reservation reservation) {
		List<ReservationDate> dates = new ArrayList<>();
		for (LocalDate d = reservation.getCheckInDate(); d.isBefore(reservation.getCheckOutDate()); d = d.plusDays(1)) {

			dates.add(new ReservationDate(
				reservation.getListing().getId(),
				d,
				reservation.getReservationId()
			));
		}
		return dates;
	}
}
