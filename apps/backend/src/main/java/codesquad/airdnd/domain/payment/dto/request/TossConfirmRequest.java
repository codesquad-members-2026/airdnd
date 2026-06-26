package codesquad.airdnd.domain.payment.dto.request;

public record TossConfirmRequest(
        String paymentKey,
        String orderId,
        Integer amount
) {
}
