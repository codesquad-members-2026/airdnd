package com.airdnd.room.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class RoomSearchRequestDtoValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsNoDates() {
        assertThat(validator.validate(withDates(null, null))).isEmpty();
    }

    @Test
    void acceptsValidDateRange() {
        assertThat(validator.validate(withDates(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3)))).isEmpty();
    }

    @Test
    void rejectsOnlyOneDate() {
        assertThat(validator.validate(withDates(LocalDate.of(2026, 7, 1), null)))
                .extracting(v -> v.getPropertyPath().toString())
                .contains("validDateRange");
    }

    @Test
    void rejectsInvertedDateRange() {
        assertThat(validator.validate(withDates(LocalDate.of(2026, 7, 3), LocalDate.of(2026, 7, 1))))
                .extracting(v -> v.getPropertyPath().toString())
                .contains("validDateRange");
    }

    // region, 인원, 가격, 경계, 커서 등은 모두 비우고 날짜만 바꿔 검증한다.
    private RoomSearchRequestDto withDates(LocalDate checkIn, LocalDate checkOut) {
        return new RoomSearchRequestDto(
                null, checkIn, checkOut,
                null, null, null, null,
                null, null, null,
                null, null, null, null,
                null, null
        );
    }
}
