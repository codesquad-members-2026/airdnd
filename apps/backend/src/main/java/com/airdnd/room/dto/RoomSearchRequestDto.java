package com.airdnd.room.dto;

import com.airdnd.room.Cursors;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.stream.Stream;

public record RoomSearchRequestDto(
        String region,
        LocalDate checkIn,
        LocalDate checkOut,
        @Min(1)
        @Max(8)
        Integer guests,
        @Min(1)
        @Max(8)
        Integer adults,
        Integer children,
        Integer infants,
        Integer minPrice,
        Integer maxPrice,
        Boolean allowsPets,
        @DecimalMin("-90")
        @DecimalMax("90")
        BigDecimal south,
        @DecimalMin("-180")
        @DecimalMax("180")
        BigDecimal west,
        @DecimalMin("-90")
        @DecimalMax("90")
        BigDecimal north,
        @DecimalMin("-180")
        @DecimalMax("180")
        BigDecimal east,
        // 목록 커서 페이지네이션
        String cursor,
        @Min(1)@Max(100)
        Integer size
) {
    private static final int DEFAULT_SIZE = 21;

    @AssertTrue(message = "지도 경계 좌표는 모두 함께 전달해야 합니다.")
    public boolean hasCompleteBounds() {
        long count = Stream.of(south, west, north, east)
                .filter(Objects::nonNull)
                .count();

        return count == 0 || count == 4;
    }

    @AssertTrue(message = "south는 north보다 작거나 같아야 합니다.")
    public boolean hasValidLatitudeOrder() {
        return south == null || north == null || south.compareTo(north) <= 0;
    }

    @AssertTrue(message = "체크인/체크아웃 날짜는 함께 전달해야 하며, 체크인이 체크아웃보다 앞서야 합니다.")
    public boolean hasValidDateRange() {
        if (checkIn == null && checkOut == null) {
            return true;
        }
        if (checkIn == null || checkOut == null) {
            return false;
        }
        return checkIn.isBefore(checkOut);
    }

    public int resolvedSize() {
        return size == null ? DEFAULT_SIZE : size;
    }

    // 불투명 커서를 마지막으로 본 id 로 디코드. 없거나 손상되면 null(첫 페이지).
    public Long cursorId() {
        return Cursors.decode(cursor);
    }
}
