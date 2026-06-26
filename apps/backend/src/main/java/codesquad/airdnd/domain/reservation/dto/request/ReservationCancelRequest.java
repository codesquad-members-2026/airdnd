package codesquad.airdnd.domain.reservation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReservationCancelRequest(
        @NotBlank(message = "환불 사유는 꼭 기입해야 합니다.")
        @Size(max = 200)
        String cancelReason
) {
}
