package codesquad.airdnd.domain.reservation.dto.response;

import java.math.BigDecimal;

public record CancelPreview(
	BigDecimal refundAmount
) {
}
