package com.airdnd.room.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record RoomStatusUpdateRequest(
        @Pattern(regexp = "ACTIVE|INACTIVE", message = "status는 ACTIVE 또는 INACTIVE 여야 합니다")
        @NotNull
        String status
) {
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
}
