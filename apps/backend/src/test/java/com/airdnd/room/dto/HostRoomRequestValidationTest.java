package com.airdnd.room.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class HostRoomRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsInvalidLocationContract() {
        HostRoomRequest request = validRequest();
        ReflectionTestUtils.setField(request, "countryCode", "kr");
        ReflectionTestUtils.setField(request, "latitude", new BigDecimal("90.0001"));
        ReflectionTestUtils.setField(request, "longitude", new BigDecimal("-180.0001"));

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("countryCode", "latitude", "longitude");
    }

    @Test
    void acceptsValidLocationContract() {
        assertThat(validator.validate(validRequest())).isEmpty();
    }

    private HostRoomRequest validRequest() {
        HostRoomRequest request = new HostRoomRequest();
        ReflectionTestUtils.setField(request, "name", "성수 스테이");
        ReflectionTestUtils.setField(request, "region", "서울");
        ReflectionTestUtils.setField(request, "address", "서울특별시 성동구 성수동");
        ReflectionTestUtils.setField(request, "pricePerNight", 145000);
        ReflectionTestUtils.setField(request, "maxGuests", 4);
        ReflectionTestUtils.setField(request, "imageUrl", "https://example.com/room.jpg");
        ReflectionTestUtils.setField(request, "allowsInfants", false);
        ReflectionTestUtils.setField(request, "allowsPets", false);
        ReflectionTestUtils.setField(request, "countryCode", "KR");
        ReflectionTestUtils.setField(request, "latitude", new BigDecimal("37.5446"));
        ReflectionTestUtils.setField(request, "longitude", new BigDecimal("127.0557"));
        return request;
    }
}
