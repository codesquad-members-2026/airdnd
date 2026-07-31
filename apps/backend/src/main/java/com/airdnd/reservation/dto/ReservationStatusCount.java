package com.airdnd.reservation.dto;

import com.airdnd.reservation.ReservationStatus;

public record ReservationStatusCount(
        ReservationStatus status,
        long count
) {
}