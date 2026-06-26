package codesquad.airdnd.global.auth.jwt;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtProvider {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_ROLE = "role";

    private final SecretKey key;
    private final long accessTokenValiditySeconds;
    private final long refreshTokenValiditySeconds;
    private final Clock clock;

    public JwtProvider(JwtProperties properties, Clock clock) {
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
        this.accessTokenValiditySeconds = properties.accessTokenValiditySeconds();
        this.refreshTokenValiditySeconds = properties.refreshTokenValiditySeconds();
        this.clock = clock;
    }

    public String createAccessToken(Long memberId, String role) {
        return buildToken(memberId, TokenType.ACCESS, role, accessTokenValiditySeconds);
    }

    public String createRefreshToken(Long memberId) {
        return buildToken(memberId, TokenType.REFRESH, null, refreshTokenValiditySeconds);
    }

    private String buildToken(Long memberId, TokenType type, String role, long validitySeconds) {
        Date now = Date.from(clock.instant());
        Date expiry = Date.from(clock.instant().plusSeconds(validitySeconds));

        var builder = Jwts.builder()
                .subject(String.valueOf(memberId))
                .claim(CLAIM_TYPE, type.name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key);

        if (role != null) {
            builder.claim(CLAIM_ROLE, role);
        }
        return builder.compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .clock(() -> Date.from(clock.instant())) // 만료 판정에도 동일한 Clock 사용
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("유효하지 않은 JWT: {}", e.getMessage());
            return false;
        }
    }

    public Long getMemberId(String token) {
        return Long.valueOf(parseClaims(token).getSubject());
    }

    public boolean isType(String token, TokenType expected) {
        try {
            String type = parseClaims(token).get(CLAIM_TYPE, String.class);
            return expected.name().equals(type);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
