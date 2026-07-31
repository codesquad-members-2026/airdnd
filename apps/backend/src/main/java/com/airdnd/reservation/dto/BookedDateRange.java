package com.airdnd.reservation.dto;

import java.time.LocalDate;

public record BookedDateRange(
        LocalDate checkInDate,
        LocalDate checkOutDate
) {}
