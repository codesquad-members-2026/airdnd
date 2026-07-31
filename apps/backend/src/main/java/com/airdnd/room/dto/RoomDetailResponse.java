package com.airdnd.room.dto;

import com.airdnd.room.Room;
import com.airdnd.room.RoomImage;

import java.math.BigDecimal;
import java.util.List;

public record RoomDetailResponse(
        Long id,
        String name,
        String region,
        String address,
        Integer pricePerNight,
        Integer maxGuests,
        String imageUrl,
        boolean isAvailable,
        boolean allowsPets,
        boolean allowsInfants,
        String description,
        List<String> amenities,
        List<String> imageUrls,
        String hostName,
        BigDecimal latitude,
        BigDecimal longitude,
        Double averageRating,
        Long reviewCount
) {
    public static RoomDetailResponse from(Room room, RoomRatingDto rating) {
        List<String> imageUrls = room.getImages().stream()
                .map(RoomImage::getImageUrl)
                .toList();

        return new RoomDetailResponse(
                room.getId(),
                room.getName(),
                room.getRegion(),
                room.getAddress(),
                room.getPricePerNight(),
                room.getMaxCapacity(),
                room.getRepresentativeImageUrl(),
                room.getIsActive(),
                room.getAllowsPets(),
                room.getAllowsInfants(),
                room.getDescription() == null ? "" : room.getDescription(),
                List.copyOf(room.getAmenities()),
                imageUrls,
                room.getHostName(),
                room.getLatitude(),
                room.getLongitude(),
                rating == null ? null : rating.averageRating(),
                rating == null ? 0L : rating.reviewCount()
        );
    }
}
