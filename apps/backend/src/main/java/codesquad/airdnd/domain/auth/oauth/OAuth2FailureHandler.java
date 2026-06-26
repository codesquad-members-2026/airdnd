package codesquad.airdnd.domain.auth.oauth;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * 소셜 로그인 실패 핸들러.
 *
 * <p>사용자가 동의를 거부했거나 토큰 교환이 실패하면 호출된다.
 * 에러 페이지로 직접 응답하지 않고, 쿼리 파라미터로 실패를 표시하며 SPA로 리다이렉트한다.</p>
 */
@Slf4j
@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    @Value("${app.oauth2.failure-redirect-uri}")
    private String failureRedirectUri;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {

        log.warn("소셜 로그인 실패: {}", exception.getMessage());
        response.sendRedirect(failureRedirectUri);
    }
}
