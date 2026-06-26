package codesquad.airdnd.domain.auth;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.global.auth.jwt.JwtCookieProvider;
import jakarta.servlet.http.Cookie;

/**
 * 자체 로그인 → 쿠키 발급 → 세션 인증(JWT 필터) → 재발급 → 로그아웃 전 과정을 검증하는 통합 테스트.
 * 세션 방식 제거 후 JWT(httpOnly 쿠키) 방식이 실제로 동작하는지 확인한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String USER_ID = "tester1";
    private static final String PASSWORD = "password123";

    @BeforeEach
    void setUp() {
        Member member = Member.builder()
                .userId(USER_ID)
                .password(passwordEncoder.encode(PASSWORD))
                .nickname("테스터1")
                .build();
        memberRepository.save(member);
    }

    private String loginBody(String userId, String password) {
        return "{\"userId\":\"" + userId + "\",\"password\":\"" + password + "\"}";
    }

    @Test
    @DisplayName("올바른 ID/PW로 로그인하면 200과 함께 access/refresh httpOnly 쿠키가 발급된다")
    void login_issuesCookies() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(USER_ID, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.authenticated").value(true))
                .andExpect(jsonPath("$.data.userId").value(USER_ID))
                .andReturn();

        Cookie access = result.getResponse().getCookie(JwtCookieProvider.ACCESS_TOKEN_COOKIE);
        Cookie refresh = result.getResponse().getCookie(JwtCookieProvider.REFRESH_TOKEN_COOKIE);
        assertThat(access).isNotNull();
        assertThat(access.isHttpOnly()).isTrue();
        assertThat(access.getValue()).isNotBlank();
        assertThat(refresh).isNotNull();
        assertThat(refresh.isHttpOnly()).isTrue();
    }

    @Test
    @DisplayName("틀린 비밀번호로 로그인하면 401을 반환한다")
    void login_wrongPassword_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(USER_ID, "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("발급받은 액세스 토큰 쿠키로 세션을 조회하면 인증된 상태로 응답한다")
    void session_withCookie_isAuthenticated() throws Exception {
        Cookie access = login().getResponse().getCookie(JwtCookieProvider.ACCESS_TOKEN_COOKIE);

        mockMvc.perform(get("/api/auth/session").cookie(access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.authenticated").value(true))
                .andExpect(jsonPath("$.data.userId").value(USER_ID));
    }

    @Test
    @DisplayName("쿠키 없이 세션을 조회하면 비인증 상태(200)로 응답한다")
    void session_withoutCookie_isAnonymous() throws Exception {
        mockMvc.perform(get("/api/auth/session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.authenticated").value(false));
    }

    @Test
    @DisplayName("리프레시 토큰 쿠키로 재발급하면 새 토큰 쿠키가 내려온다")
    void refresh_rotatesTokens() throws Exception {
        Cookie refresh = login().getResponse().getCookie(JwtCookieProvider.REFRESH_TOKEN_COOKIE);

        MvcResult result = mockMvc.perform(post("/api/auth/refresh").cookie(refresh))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.authenticated").value(true))
                .andReturn();

        assertThat(result.getResponse().getCookie(JwtCookieProvider.ACCESS_TOKEN_COOKIE)).isNotNull();
        assertThat(result.getResponse().getCookie(JwtCookieProvider.REFRESH_TOKEN_COOKIE)).isNotNull();
    }

    @Test
    @DisplayName("액세스 토큰을 리프레시 엔드포인트에 제출하면 401(토큰 종류 불일치)")
    void refresh_withAccessToken_returns401() throws Exception {
        Cookie access = login().getResponse().getCookie(JwtCookieProvider.ACCESS_TOKEN_COOKIE);
        // 액세스 토큰을 refresh_token 쿠키 이름으로 위장해 제출
        Cookie fake = new Cookie(JwtCookieProvider.REFRESH_TOKEN_COOKIE, access.getValue());

        mockMvc.perform(post("/api/auth/refresh").cookie(fake))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("로그아웃하면 쿠키가 만료(Max-Age=0)되고 서버 리프레시 토큰이 제거된다")
    void logout_clearsCookiesAndStoredToken() throws Exception {
        Cookie access = login().getResponse().getCookie(JwtCookieProvider.ACCESS_TOKEN_COOKIE);

        MvcResult result = mockMvc.perform(post("/api/auth/logout").cookie(access))
                .andExpect(status().isOk())
                .andReturn();

        Cookie clearedAccess = result.getResponse().getCookie(JwtCookieProvider.ACCESS_TOKEN_COOKIE);
        assertThat(clearedAccess).isNotNull();
        assertThat(clearedAccess.getMaxAge()).isZero();
        assertThat(memberRepository.findByUserId(USER_ID)).get()
                .extracting(Member::getRefreshToken).isNull();
    }

    /** 로그인 후 결과(쿠키 포함)를 반환하는 헬퍼 */
    private MvcResult login() throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(USER_ID, PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();
    }
}
