package codesquad.airdnd.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "아이디는 필수입니다.")
        @Pattern(
                regexp = "^[a-zA-Z][a-zA-Z0-9_]{3,19}$",
                message = "아이디는 영문자로 시작하는 4~20자의 영문/숫자/밑줄(_)이어야 합니다."
        )
        String userId,

        @NotBlank(message = "비밀번호는 필수입니다.")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,20}$",
                message = "비밀번호는 영문과 숫자를 포함한 8~20자여야 합니다."
        )
        String password,

        @NotBlank(message = "닉네임은 필수입니다.")
        @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다.")
        @Pattern(
                regexp = "^[a-zA-Z0-9가-힣]+$",
                message = "닉네임은 영문/숫자/한글만 가능합니다."
        )
        String nickname
) {}