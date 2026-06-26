package codesquad.airdnd.domain.payment.dto.response;

import java.math.BigDecimal;

public record PaymentPrepareResponse(
    String orderId,
    String orderName,
    String successUrl,
    String failUrl,
    BigDecimal amount
) {

    public static PaymentPrepareResponse of(
            String orderId, String orderName, String successUrl, String failUrl, BigDecimal amount) {

        return new PaymentPrepareResponse(orderId, orderName, successUrl, failUrl, amount);
    }
}
