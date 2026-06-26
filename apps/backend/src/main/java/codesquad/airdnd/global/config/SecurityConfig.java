package codesquad.airdnd.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import codesquad.airdnd.domain.auth.oauth.CustomOAuth2UserService;
import codesquad.airdnd.domain.auth.oauth.OAuth2FailureHandler;
import codesquad.airdnd.domain.auth.oauth.OAuth2SuccessHandler;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.global.auth.jwt.JwtAuthenticationFilter;
import codesquad.airdnd.global.auth.jwt.JwtCookieProvider;
import codesquad.airdnd.global.auth.jwt.JwtProperties;
import codesquad.airdnd.global.auth.jwt.JwtProvider;

import java.util.List;

/**
 * 인증/인가 전반 설정. 세션 방식에서 JWT(STATELESS) 방식으로 전환한다.
 *
 * <ul>
 *     <li>세션 미사용(STATELESS): 매 요청 {@link JwtAuthenticationFilter}가 쿠키의 액세스 토큰으로 인증을 복원.</li>
 *     <li>자체 로그인(A): {@code POST /api/auth/login}에서 {@link AuthenticationManager}로 검증 후 JWT 발급(컨트롤러 담당).</li>
 *     <li>소셜 로그인(B): {@code oauth2Login} → {@link CustomOAuth2UserService} → {@link OAuth2SuccessHandler}에서 JWT 발급.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtProvider jwtProvider,
            JwtCookieProvider cookieProvider,
            MemberRepository memberRepository,
            CustomOAuth2UserService customOAuth2UserService,
            OAuth2SuccessHandler oAuth2SuccessHandler,
            OAuth2FailureHandler oAuth2FailureHandler
    ) throws Exception {

        JwtAuthenticationFilter jwtAuthenticationFilter =
                new JwtAuthenticationFilter(jwtProvider, cookieProvider, memberRepository);

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable()) // STATELESS + 쿠키지만 SameSite=Lax로 CSRF 위험 완화. (CSRF 토큰 미사용)
                // 세션을 만들지 않는다(JWT로 무상태 인증).
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // auth 도메인 전체 + OAuth2 콜백 + Swagger (인증 없이 접근)
                        // TODO: 배포 시 Swagger(/v3/api-docs, /swagger-ui)는 prod 프로파일에서 비노출 처리 — 별도 배포 브랜치에서 작업
                        .requestMatchers(
                                "/api/auth/**",
                                // OAuth2 인가 요청/콜백 엔드포인트
                                "/oauth2/**", "/login/oauth2/**",
                                // Swagger / OpenAPI
                                "/v3/api-docs/**", "/swagger-ui/**"
                        ).permitAll()
                        // 비회원도 숙소 목록/상세는 조회 가능(GET 한정).
                        // GET 으로 스코프하지 않으면 POST /api/listings/{id}/reservations(예약 생성)까지 열리므로 주의.
                        .requestMatchers(HttpMethod.GET, "/api/listings/**").permitAll()
                        // 결제/예약/위시리스트/호스트 등 나머지는 모두 로그인 필요
                        .anyRequest().authenticated()
                )
                // 소셜 로그인: 사용자 매핑 서비스 + 성공/실패 핸들러 연결
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                )
                // JWT 필터를 표준 폼 인증 필터 앞에 배치해 매 요청 인증을 복원.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // 미인증 시 리다이렉트 대신 401 반환(SPA 친화적).
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));

        return http.build();
    }

    /**
     * 자체 로그인 검증에 쓰는 AuthenticationManager. (UserDetailsService + PasswordEncoder 기반)
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed-origins}") String allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));  // yml 값 사용
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
