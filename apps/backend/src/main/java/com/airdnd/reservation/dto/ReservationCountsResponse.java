package com.airdnd.reservation.dto;

public record ReservationCountsResponse (
        long all,
        long confirmed,
        long pending,
        long cancelled
) {
}
