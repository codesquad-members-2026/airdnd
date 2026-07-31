package com.airdnd.room.dto;

import com.airdnd.room.Room;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record RoomResponse (

        Long id,
        String name,
        String region,
        String address,
        Integer pricePerNight,
        Integer maxGuests,
        String imageUrl,
        BigDecimal latitude,
        BigDecimal longitude,
        boolean isAvailable,
        boolean allowsPets,
        Double averageRating,
        Long reviewCount
)
{
    public static RoomResponse from(Room room, RoomRatingDto rating){
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getRegion(),
                room.getAddress(),
                room.getPricePerNight(),
                room.getMaxCapacity(),
                room.getRepresentativeImageUrl(),
                room.getLatitude(),
                room.getLongitude(),
                room.getIsActive(),
                room.getAllowsPets(),
                rating == null ? null : rating.averageRating(),
                rating == null ? 0L : rating.reviewCount()
        );
    }

    public static List<RoomResponse> fromList(List<Room> rooms, Map<Long,RoomRatingDto> ratings){
        return rooms.stream().map(
                room -> from(room, ratings.get(room.getId()))
        ).toList();
    }
}
