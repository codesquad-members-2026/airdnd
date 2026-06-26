package codesquad.airdnd.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 자체 로그인(ID/PW) 요청 바디.
 */
public record LoginRequest(
        @NotBlank(message = "아이디는 필수입니다.") String userId,
        @NotBlank(message = "비밀번호는 필수입니다.") String password
) {
}
