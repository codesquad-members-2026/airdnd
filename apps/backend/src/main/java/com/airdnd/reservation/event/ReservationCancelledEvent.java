package com.airdnd.reservation.event;

import java.time.LocalDate;

public record ReservationCancelledEvent (
        Long reservationId,
        Long hostId,
        Long roomId,
        String roomName,
        LocalDate checkInDate,
        LocalDate checkOutDate
){ }
