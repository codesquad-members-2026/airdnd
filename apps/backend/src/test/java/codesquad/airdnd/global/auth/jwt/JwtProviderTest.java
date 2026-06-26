package codesquad.airdnd.global.auth.jwt;

import static org.assertj.core.api.Assertions.*;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

/**
 * JwtProvider 단위 테스트. 고정/이동 가능한 Clock으로 발급·검증·만료를 검증한다.
 */
class JwtProviderTest {

    // HS256은 최소 32byte 시크릿 필요
    private static final String SECRET = "test-secret-key-for-jwt-provider-unit-test-1234567890";
    private static final long ACCESS_VALIDITY = 1800;      // 30분
    private static final long REFRESH_VALIDITY = 1209600;  // 14일
    private static final Instant FIXED_NOW = Instant.parse("2026-06-22T00:00:00Z");

    private JwtProvider providerAt(Instant now) {
        Clock clock = Clock.fixed(now, ZoneId.of("UTC"));
        JwtProperties props = new JwtProperties(SECRET, ACCESS_VALIDITY, REFRESH_VALIDITY);
        return new JwtProvider(props, clock);
    }

    @Nested
    @DisplayName("액세스 토큰")
    class AccessToken {

        @Test
        @DisplayName("발급한 액세스 토큰의 subject=memberId, type=ACCESS, role 클레임이 담긴다")
        void containsClaims() {
            JwtProvider provider = providerAt(FIXED_NOW);

            String token = provider.createAccessToken(42L, "ROLE_USER");

            Claims claims = provider.parseClaims(token);
            assertThat(claims.getSubject()).isEqualTo("42");
            assertThat(claims.get("type", String.class)).isEqualTo("ACCESS");
            assertThat(claims.get("role", String.class)).isEqualTo("ROLE_USER");
            assertThat(provider.getMemberId(token)).isEqualTo(42L);
            assertThat(provider.isType(token, TokenType.ACCESS)).isTrue();
            assertThat(provider.isType(token, TokenType.REFRESH)).isFalse();
        }

        @Test
        @DisplayName("만료 시간이 지나면 유효하지 않다")
        void expiresAfterValidity() {
            String token = providerAt(FIXED_NOW).createAccessToken(1L, "ROLE_USER");

            // 31분 뒤 시계로 검증 → 만료
            JwtProvider later = providerAt(FIXED_NOW.plusSeconds(ACCESS_VALIDITY + 60));
            assertThat(later.isValid(token)).isFalse();
            assertThatThrownBy(() -> later.parseClaims(token)).isInstanceOf(JwtException.class);
        }
    }

    @Nested
    @DisplayName("리프레시 토큰")
    class RefreshToken {

        @Test
        @DisplayName("리프레시 토큰은 type=REFRESH 이고 role 클레임이 없다")
        void typeIsRefresh() {
            JwtProvider provider = providerAt(FIXED_NOW);

            String token = provider.createRefreshToken(7L);

            assertThat(provider.isType(token, TokenType.REFRESH)).isTrue();
            assertThat(provider.parseClaims(token).get("role", String.class)).isNull();
            assertThat(provider.getMemberId(token)).isEqualTo(7L);
        }
    }

    @Nested
    @DisplayName("서명 검증")
    class Signature {

        @Test
        @DisplayName("다른 시크릿으로 서명된 토큰은 유효하지 않다")
        void rejectsDifferentSecret() {
            String token = providerAt(FIXED_NOW).createAccessToken(1L, "ROLE_USER");

            JwtProperties otherProps =
                    new JwtProperties("another-secret-key-totally-different-0987654321!!", ACCESS_VALIDITY, REFRESH_VALIDITY);
            JwtProvider otherProvider = new JwtProvider(otherProps, Clock.fixed(FIXED_NOW, ZoneId.of("UTC")));

            assertThat(otherProvider.isValid(token)).isFalse();
        }

        @Test
        @DisplayName("형식이 잘못된 토큰은 유효하지 않다")
        void rejectsMalformedToken() {
            JwtProvider provider = providerAt(FIXED_NOW);
            assertThat(provider.isValid("not-a-jwt")).isFalse();
        }
    }
}
