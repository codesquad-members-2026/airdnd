package com.airdnd.room.dto;

import com.airdnd.room.Room;
import com.airdnd.room.RoomImage;

import java.math.BigDecimal;
import java.util.List;

public record HostRoomResponse (
        Long id,
        String name,
        String region,
        String address,
        String description,
        Integer pricePerNight,
        Integer rating,
        Integer reviewCount,
        Integer maxGuests,
        String imageUrl,
        List<String> imageUrls,
        Boolean isAvailable,
        Boolean allowsPets,
        Boolean allowsInfants,
        List<String> amenities,
        String hostName,
        BigDecimal latitude,
        BigDecimal longitude,
        String status
) {
    // 이미지가 전혀 없을 때 프론트엔드의 URL 스키마 검증(.url())을 통과시키기 위한 대체 이미지
    private static final String PLACEHOLDER_IMAGE_URL = "https://placehold.co/600x400?text=No+Image";

    public static HostRoomResponse from(Room room) {
        List<RoomImage> images = room.getImages();

        // C1: 대표 이미지가 없으면 첫 이미지, 그마저 없으면 빈 문자열 대신 유효한 대체 URL을 반환
        String representativeImageUrl = images.stream()
                .filter(RoomImage::getIsRepresentative)
                .findFirst()
                .map(RoomImage::getImageUrl)
                .orElseGet(() -> images.isEmpty() ? PLACEHOLDER_IMAGE_URL : images.get(0).getImageUrl());

        // C3: 대표 이미지를 제외한 추가 이미지 목록(갤러리/수정 폼용)을 채워서 반환
        List<String> additionalImageUrls = images.stream()
                .filter(image -> !image.getIsRepresentative())
                .map(RoomImage::getImageUrl)
                .toList();

        // C2: description은 nullable이므로 프론트엔드 required string 스키마에 맞춰 빈 문자열로 보정
        String description = room.getDescription() == null ? "" : room.getDescription();
        String status = room.getIsActive() ? "ACTIVE" : "INACTIVE";

        return new HostRoomResponse(
                room.getId(),
                room.getName(),
                room.getRegion(),
                room.getAddress(),
                description,
                room.getPricePerNight(),
                0, // 임시 더미 데이터 (rating)
                0, // 임시 더미 데이터 (reviewCount)
                room.getMaxCapacity(), // maxGuests 매핑
                representativeImageUrl,
                additionalImageUrls,
                room.getIsActive(), // isAvailable 매핑
                room.getAllowsPets(),
                room.getAllowsInfants(),
                List.copyOf(room.getAmenities()),
                "테스트 호스트", // 임시 더미 데이터 (hostName)
                room.getLatitude(),
                room.getLongitude(),
                status
        );
    }
}
