package codesquad.airdnd.domain.auth;

import codesquad.airdnd.domain.auth.dto.LoginRequest;
import codesquad.airdnd.domain.auth.dto.SessionResponse;
import codesquad.airdnd.domain.auth.dto.SignupRequest;
import codesquad.airdnd.global.response.ApiResponse;
import codesquad.airdnd.global.auth.security.AirdndUserDetails;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final AuthTokenService authTokenService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> signup(
            @RequestBody @Valid SignupRequest request
    ){
        return ApiResponse.success(authService.signup(request));
    }

    /**
     * 자체 로그인(A 흐름). ID/PW를 AuthenticationManager로 검증한 뒤 JWT를 httpOnly 쿠키로 발급한다.
     * 세션을 만들지 않으며(STATELESS), 인증 결과는 쿠키의 토큰으로만 유지된다.
     *
     * @return 로그인한 회원의 세션 정보
     */
    @PostMapping("/login")
    public ApiResponse<SessionResponse> login(
            @RequestBody @Valid LoginRequest request,
            HttpServletResponse response
    ){
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.userId(), request.password()));
        } catch (AuthenticationServiceException e) {
            // 내부 오류(예: UserDetailsService 예외)는 그대로 노출하지 않고 500으로 처리되게 재던짐
            throw e;
        } catch (AuthenticationException e) {
            // 아이디 없음/비번 불일치 등 → 401
            throw new BusinessException(ErrorCode.MEMBER_UNAUTHORIZED);
        }

        AirdndUserDetails principal = (AirdndUserDetails) authentication.getPrincipal();
        authTokenService.issueTokens(response, principal.getMember().getId());
        return ApiResponse.success(SessionResponse.of(principal.getMember()));
    }

    /**
     * 액세스 토큰 만료 시 리프레시 토큰으로 재발급(C 흐름). 쿠키의 리프레시 토큰을 검증·회전한다.
     *
     * @return 재발급 후 회원의 세션 정보
     */
    @PostMapping("/refresh")
    public ApiResponse<SessionResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ){
        return ApiResponse.success(authTokenService.reissue(request, response));
    }

    /**
     * 로그아웃. 서버의 리프레시 토큰을 제거하고 클라이언트 쿠키도 만료시킨다.
     * 액세스 토큰이 만료되어 principal이 없어도 쿠키 정리는 수행한다.
     */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @AuthenticationPrincipal AirdndUserDetails principal,
            HttpServletResponse response
    ){
        Long memberId = (principal != null) ? principal.getMember().getId() : null;
        authTokenService.clearTokens(response, memberId);
        return ApiResponse.success();
    }

    @GetMapping("/session")
    public ApiResponse<SessionResponse> session(
            @AuthenticationPrincipal AirdndUserDetails principal
    ){
        SessionResponse response = (principal != null) ?
                SessionResponse.of(principal.getMember()) : SessionResponse.anonymous();
        return ApiResponse.success(response);
    }
}
