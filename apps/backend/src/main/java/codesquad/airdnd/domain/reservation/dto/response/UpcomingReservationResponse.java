package codesquad.airdnd.domain.reservation.dto.response;

import java.util.List;

public record UpcomingReservationResponse(
	List<ReservationSummary> reservations
) {
}
