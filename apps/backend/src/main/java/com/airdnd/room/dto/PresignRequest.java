package com.airdnd.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PresignRequest(

        @NotBlank(message = "파일 이름은 필수입니다.")
        String fileName,

        @NotBlank(message = "콘텐츠 타입은 필수입니다.")
        @Pattern(regexp = "image/(jpeg|png|webp)", message = "jpeg, png, webp 이미지만 업로드할 수 있습니다.")
        String contentType
) {}