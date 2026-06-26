package codesquad.airdnd.domain.payment.dto.request;

import java.math.BigDecimal;

public record PaymentConfirmRequest (
        String orderId,
        String paymentKey,
        BigDecimal amount
){
}