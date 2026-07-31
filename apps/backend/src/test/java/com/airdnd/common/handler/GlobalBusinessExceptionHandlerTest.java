package com.airdnd.common.handler;

import com.airdnd.room.dto.HostRoomRequest;
import jakarta.validation.Valid;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalBusinessExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalBusinessExceptionHandler())
                .build();
    }

    @Test
    void returnsValidationErrorContractWhenRequestBodyCannotBeRead() throws Exception {
        mockMvc.perform(post("/test/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "pricePerNight": "not-a-number"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("요청 값의 형식이 올바르지 않습니다."));
    }

    @RestController
    private static class TestController {

        @PostMapping("/test/rooms")
        void createRoom(@RequestBody @Valid HostRoomRequest request) {
        }
    }
}
