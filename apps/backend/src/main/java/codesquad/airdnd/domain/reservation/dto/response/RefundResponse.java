package codesquad.airdnd.domain.reservation.dto.response;

import codesquad.airdnd.domain.payment.dto.response.TossCancelResponse;
import codesquad.airdnd.domain.payment.entity.Payment;
import codesquad.airdnd.domain.reservation.entity.Reservation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RefundResponse(
        String orderId,
        String orderName,
        String cancelReason,
        LocalDateTime canceledAt,
        BigDecimal refundAmount,
        LocalDate checkInDate,
        LocalDate checkOutDate
) {

    public static RefundResponse of(Payment payment, Reservation reservation, TossCancelResponse tossCancelResponse) {

        return new RefundResponse(
                payment.getOrderId(), tossCancelResponse.orderName(),
                tossCancelResponse.cancelReason(),
                payment.getCanceledAt(), payment.getAmount(),
                reservation.getCheckInDate(), reservation.getCheckOutDate()
        );
    }
}
