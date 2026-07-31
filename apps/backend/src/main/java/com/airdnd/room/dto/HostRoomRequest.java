package com.airdnd.room.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@NoArgsConstructor
public class HostRoomRequest {
    @NotBlank(message = "숙소 이름은 필수입니다.")
    private String name;

    @NotBlank(message = "지역은 필수입니다.")
    private String region;

    @NotBlank(message = "상세 주소는 필수입니다.")
    private String address;

    private String description;

    @NotNull(message = "가격은 필수입니다.")
    @Min(value = 1, message = "1박당 가격은 최소 1원 이상이어야 합니다.")
    @Max(value = 50000000, message = "1박당 최대 가격은 50000000원 입니다")
    private Integer pricePerNight;

    @NotNull(message = "최대 인원은 필수입니다.")
    @Min(value = 1, message = "최대 수용 인원은 최소 1명 이상이어야 합니다.")
    private Integer maxGuests;

    @NotBlank(message = "대표 이미지 URL은 필수입니다.")
    private String imageUrl;

    private List<String> imageUrls;

    private List<String> amenities;

    @NotNull(message = "유아 동반 가능 여부를 선택해주세요.")
    private Boolean allowsInfants;

    @NotNull(message = "반려동물 동반 가능 여부를 선택해주세요.")
    private Boolean allowsPets;

    @NotBlank(message = "국가 코드는 필수입니다.")
    @Pattern(regexp = "^[A-Z]{2}$", message = "국가 코드는 대문자 ISO 2자리 코드여야 합니다.")
    private String countryCode;

    @NotNull(message = "위도는 필수입니다.")
    @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
    @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다.")
    private BigDecimal latitude;

    @NotNull(message = "경도는 필수입니다.")
    @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
    @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다.")
    private BigDecimal longitude;
}
