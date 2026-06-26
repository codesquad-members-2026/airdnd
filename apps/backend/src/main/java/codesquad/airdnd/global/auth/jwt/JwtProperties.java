package codesquad.airdnd.global.auth.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * application.yml의 {@code jwt.*} 설정을 바인딩하는 불변 프로퍼티.
 *
 * <ul>
 *     <li>{@code secret} : HMAC-SHA 서명 키 원문. HS256은 최소 256bit(32byte) 이상이어야 한다.</li>
 *     <li>{@code accessTokenValiditySeconds} : 액세스 토큰 유효기간(초).</li>
 *     <li>{@code refreshTokenValiditySeconds} : 리프레시 토큰 유효기간(초).</li>
 * </ul>
 *
 * {@code @EnableConfigurationProperties(JwtProperties.class)}로 등록한다(SecurityConfig 참조).
 */
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String secret,
        long accessTokenValiditySeconds,
        long refreshTokenValiditySeconds
) {
}
