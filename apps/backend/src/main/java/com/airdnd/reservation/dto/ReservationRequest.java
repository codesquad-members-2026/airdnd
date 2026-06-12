package com.airdnd.reservation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;


public record ReservationRequest (

        Long guestId,
        Long roomId,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        Integer totalPrice,
        int adultCount,
        int childCount,
        int infantCount,
        boolean hasPets
)
{ }
