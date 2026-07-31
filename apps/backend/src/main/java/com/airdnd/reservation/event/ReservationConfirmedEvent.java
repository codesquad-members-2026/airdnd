package com.airdnd.reservation.event;

import java.time.LocalDate;

public record ReservationConfirmedEvent (
        Long reservationId,
        Long guestId,
        Long hostId,
        Long roomId,
        String roomName,
        LocalDate checkInDate,
        LocalDate checkOutDate
){ }
