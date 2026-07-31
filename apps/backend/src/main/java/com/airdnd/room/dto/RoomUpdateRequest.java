package com.airdnd.room.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.List;

// 부분 수정(PATCH)이라 필드는 null 허용. 값이 들어오면 생성 시(HostRoomRequest)와 동일한 범위로 검증한다.
public record RoomUpdateRequest (

        String name,
        String description,

        @Min(value = 1, message = "1박당 가격은 최소 1원 이상이어야 합니다.")
        @Max(value = 50000000, message = "1박당 최대 가격은 50000000원 입니다")
        Integer pricePerNight,

        @Min(value = 1, message = "최대 수용 인원은 최소 1명 이상이어야 합니다.")
        Integer maxGuests,

        Boolean allowsInfants,
        Boolean allowsPets,
        List<String> amenities,
        List<String> imageUrls

){ }