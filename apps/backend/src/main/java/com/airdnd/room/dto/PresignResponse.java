package com.airdnd.room.dto;

public record PresignResponse(
        String uploadUrl,
        String objectKey,
        String publicUrl
) {
}
