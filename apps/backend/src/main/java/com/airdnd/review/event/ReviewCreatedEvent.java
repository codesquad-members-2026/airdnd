package com.airdnd.review.event;

public record ReviewCreatedEvent (
        Long roomId,
        Long hostId,
        String roomName,
        double rating
) {}
