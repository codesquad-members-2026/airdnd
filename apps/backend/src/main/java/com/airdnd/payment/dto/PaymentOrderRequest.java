package com.airdnd.payment.dto;

import jakarta.validation.constraints.NotNull;

public record PaymentOrderRequest(
        @NotNull(message = "예약 정보는 필수입니다")
        Long reservationId
) { }
