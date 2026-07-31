package com.airdnd.reservation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;


public record ReservationRequest (

        @NotNull(message = "숙소 정보는 필수입니다")
        Long roomId,

        @NotNull(message = "체크인 날짜는 필수입니다")
        LocalDate checkInDate,

        @NotNull(message = "체크아웃 날짜는 필수입니다")
        LocalDate checkOutDate,

        @Min(value = 1, message = "성인은 최소 1명 이상이어야 합니다")
        int adultCount,

        @PositiveOrZero(message = "어린이 인원은 0명 이상이어야 합니다")
        int childCount,

        @PositiveOrZero(message = "유아 인원은 0명 이상이어야 합니다")
        int infantCount,

        boolean hasPets
)
{ }
