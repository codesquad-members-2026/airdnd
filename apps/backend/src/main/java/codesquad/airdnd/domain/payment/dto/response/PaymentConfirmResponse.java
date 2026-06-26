package codesquad.airdnd.domain.payment.dto.response;

import codesquad.airdnd.domain.payment.entity.Payment;
import codesquad.airdnd.domain.payment.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentConfirmResponse(
        String orderId,
        PaymentStatus status,
        BigDecimal amount,
        String method,
        LocalDateTime approvedAt,
        Long reservationId
) {

    public static PaymentConfirmResponse from(Payment payment){
        return new PaymentConfirmResponse(
                payment.getOrderId(), payment.getStatus(), payment.getAmount(),
                payment.getMethod(), payment.getApprovedAt(), payment.getReservationId()
        );
    }
}
