package com.airdnd.room.dto;

public record RoomRatingDto (
        Long roomId,
        Double averageRating,
        Long reviewCount
)
{ }
