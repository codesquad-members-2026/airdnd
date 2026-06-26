package codesquad.airdnd.domain.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import codesquad.airdnd.domain.auth.dto.SessionResponse;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.global.auth.jwt.JwtCookieProvider;
import codesquad.airdnd.global.auth.jwt.JwtProvider;
import codesquad.airdnd.global.auth.jwt.TokenType;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * 자체 로그인(A)·소셜 로그인(B)·토큰 재발급이 공통으로 쓰는 "토큰 발급/폐기" 합류 지점.
 *
 * <p>액세스/리프레시 JWT를 만들고, 리프레시 토큰은 회원 레코드에 저장(서버 측 무효화 가능하게)하며,
 * 두 토큰을 httpOnly 쿠키로 응답에 싣는다.</p>
 */
@Service
@RequiredArgsConstructor
public class AuthTokenService {

    // 현재 권한 모델은 단일 역할. 권한 분리(admin 등) 도입 시 회원에서 역할을 읽도록 확장한다.
    private static final String DEFAULT_ROLE = "ROLE_USER";

    private final JwtProvider jwtProvider;
    private final JwtCookieProvider cookieProvider;
    private final MemberRepository memberRepository;

    /**
     * 회원에게 액세스/리프레시 토큰을 발급해 쿠키로 내려보낸다. 리프레시 토큰은 DB에도 저장한다.
     *
     * @param response 쿠키를 실을 응답
     * @param memberId 토큰 주체 회원 PK
     */
    @Transactional
    public void issueTokens(HttpServletResponse response, Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        writeTokens(response, member);
    }

    /**
     * 리프레시 토큰으로 액세스/리프레시 토큰을 재발급한다(회전).
     *
     * <p>검증: 쿠키의 리프레시 토큰이 (1) REFRESH 타입이고 (2) 서명/만료가 유효하며
     * (3) DB에 저장된 값과 일치해야 한다. 일치하지 않으면(로그아웃됨/탈취 의심) 401로 거절한다.</p>
     *
     * @return 재발급 후 현재 로그인 회원 정보
     */
    @Transactional
    public SessionResponse reissue(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = cookieProvider.extractRefreshToken(request)
                .filter(token -> jwtProvider.isType(token, TokenType.REFRESH))
                .filter(jwtProvider::isValid)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_UNAUTHORIZED));

        Long memberId = jwtProvider.getMemberId(refreshToken);
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_UNAUTHORIZED));

        // 저장된 리프레시 토큰과 일치하는지 확인(서버 측 무효화/탈취 방어)
        if (!refreshToken.equals(member.getRefreshToken())) {
            throw new BusinessException(ErrorCode.MEMBER_UNAUTHORIZED);
        }

        writeTokens(response, member);
        return SessionResponse.of(member);
    }

    /**
     * 관리 상태의 회원에게 토큰을 발급하고 쿠키에 싣는 공통 로직.
     * 리프레시 토큰은 회원 레코드에 저장(회전)된다.
     */
    private void writeTokens(HttpServletResponse response, Member member) {
        String accessToken = jwtProvider.createAccessToken(member.getId(), DEFAULT_ROLE);
        String refreshToken = jwtProvider.createRefreshToken(member.getId());

        member.updateRefreshToken(refreshToken); // 더티 체킹으로 저장

        cookieProvider.addAccessTokenCookie(response, accessToken);
        cookieProvider.addRefreshTokenCookie(response, refreshToken);
    }

    /**
     * 로그아웃: 서버에 저장된 리프레시 토큰을 지우고, 클라이언트 쿠키도 만료시킨다.
     *
     * @param response 쿠키 만료 헤더를 실을 응답
     * @param memberId 로그아웃할 회원 PK(없으면 쿠키만 정리)
     */
    @Transactional
    public void clearTokens(HttpServletResponse response, Long memberId) {
        if (memberId != null) {
            memberRepository.findById(memberId).ifPresent(Member::clearRefreshToken);
        }
        cookieProvider.clearTokenCookies(response);
    }
}
