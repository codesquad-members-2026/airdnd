package codesquad.airdnd.domain.payment.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TossConfirmResponse(
        String paymentKey,
        String orderId,
        String status,
        String method,
        String approvedAt
) {
}
