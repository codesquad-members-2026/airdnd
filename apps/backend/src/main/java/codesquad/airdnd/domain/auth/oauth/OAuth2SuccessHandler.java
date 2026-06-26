package codesquad.airdnd.domain.auth.oauth;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import codesquad.airdnd.domain.auth.AuthTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * 소셜 로그인 성공 핸들러(B 흐름의 마무리).
 *
 * <p>Google 인증이 끝나고 {@link CustomOAuth2UserService}가 회원을 확정하면 호출된다.
 * 우리 JWT(액세스/리프레시)를 httpOnly 쿠키로 발급한 뒤, SPA로 리다이렉트한다.
 * SPA는 별도 토큰 처리 없이 쿠키만으로 로그인 상태가 된다(세션 조회로 확인).</p>
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final AuthTokenService authTokenService;

    @Value("${app.oauth2.success-redirect-uri}")
    private String successRedirectUri;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2UserPrincipal principal = (OAuth2UserPrincipal) authentication.getPrincipal();

        // 우리 토큰 발급 + 쿠키 부착 (리프레시 토큰은 DB에도 저장됨)
        authTokenService.issueTokens(response, principal.getMember().getId());

        // 프론트로 복귀. 신규 가입/기존 로그인을 쿼리로 알려 프론트가 성공 메시지를 구분해 띄운다.
        // (successRedirectUri 는 쿼리가 없는 형태(예: https://app/)이므로 ? 로 바로 붙인다)
        String redirectUri = successRedirectUri + (principal.isNewUser() ? "?auth=signup" : "?auth=login");
        response.sendRedirect(redirectUri);
    }
}
