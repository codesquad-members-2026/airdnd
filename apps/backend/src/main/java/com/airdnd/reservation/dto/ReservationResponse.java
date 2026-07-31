package com.airdnd.reservation.dto;

import com.airdnd.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReservationResponse (
        Long id,
        Long roomId,
        String roomName,
        String roomUrl,
        String region,
        LocalDate checkIn,
        LocalDate checkOut,
        Integer guests,
        Integer pricePerNight,
        Long totalPrice,
        ReservationStatus status,
        LocalDateTime expiresAt,
        LocalDateTime createdAt,
        boolean hasReview
)
{
}
