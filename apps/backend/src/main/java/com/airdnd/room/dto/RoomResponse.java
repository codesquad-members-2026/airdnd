package com.airdnd.room.dto;

public record RoomResponse (

        Long id,
        String name,
        String region,
        String address,
        Integer pricePerNight,
        Integer maxGuests,
        String imageUrl,
        boolean isAvailable,
        boolean allowsPets
)

{ }
