package codesquad.airdnd.global.auth.jwt;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * JWT를 httpOnly 쿠키로 주고받는 헬퍼.
 *
 * <p>토큰을 응답 바디(localStorage)가 아니라 httpOnly 쿠키로 전달하기로 했으므로(자바스크립트 접근 차단 → XSS 방어),
 * 액세스/리프레시 토큰의 쿠키 생성·삭제·추출을 한곳에 모은다.</p>
 *
 * <p>SameSite=Lax: 프론트(localhost:5173)와 백엔드(localhost:8080)는 같은 사이트(localhost)라
 * Lax로도 fetch(credentials:'include')와 OAuth 리다이렉트 모두 쿠키가 전송된다. 운영 HTTPS에서는 Secure를 켠다.</p>
 */
@Component
public class JwtCookieProvider {

    public static final String ACCESS_TOKEN_COOKIE = "access_token";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    private final long accessTokenValiditySeconds;
    private final long refreshTokenValiditySeconds;

    public JwtCookieProvider(JwtProperties properties) {
        this.accessTokenValiditySeconds = properties.accessTokenValiditySeconds();
        this.refreshTokenValiditySeconds = properties.refreshTokenValiditySeconds();
    }

    /**
     * 액세스 토큰 쿠키를 응답에 추가한다. maxAge는 토큰 유효기간과 동일.
     */
    public void addAccessTokenCookie(HttpServletResponse response, String token) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie(ACCESS_TOKEN_COOKIE, token, accessTokenValiditySeconds).toString());
    }

    /**
     * 리프레시 토큰 쿠키를 응답에 추가한다.
     */
    public void addRefreshTokenCookie(HttpServletResponse response, String token) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie(REFRESH_TOKEN_COOKIE, token, refreshTokenValiditySeconds).toString());
    }

    /**
     * 액세스/리프레시 쿠키를 모두 만료(maxAge=0)시켜 클라이언트에서 제거한다. (로그아웃 시 사용)
     */
    public void clearTokenCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(ACCESS_TOKEN_COOKIE, "", 0).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(REFRESH_TOKEN_COOKIE, "", 0).toString());
    }

    /**
     * 요청 쿠키에서 액세스 토큰 값을 꺼낸다.
     */
    public Optional<String> extractAccessToken(HttpServletRequest request) {
        return extract(request, ACCESS_TOKEN_COOKIE);
    }

    /**
     * 요청 쿠키에서 리프레시 토큰 값을 꺼낸다.
     */
    public Optional<String> extractRefreshToken(HttpServletRequest request) {
        return extract(request, REFRESH_TOKEN_COOKIE);
    }

    /**
     * 지정한 이름의 쿠키 값을 Optional로 반환한다. 쿠키가 없으면 empty.
     */
    private Optional<String> extract(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> name.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    /**
     * httpOnly 쿠키를 만든다. path=/ 로 전체 경로에서 전송, SameSite=Lax.
     */
    private ResponseCookie buildCookie(String name, String value, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false)       // TODO: 운영(HTTPS)에서는 true로
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .sameSite("Lax")
                .build();
    }
}
