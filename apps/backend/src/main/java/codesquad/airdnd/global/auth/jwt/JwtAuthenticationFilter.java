package codesquad.airdnd.global.auth.jwt;

import java.io.IOException;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.global.auth.security.AirdndUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

// 모든 요청을 이곳에서 먼저 검증 -> 토큰이 존재한다면 검사하고 검증을 통과하면 SecurityContextHolder에 UserDetails 형식으로 저장
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final JwtCookieProvider cookieProvider;
    private final MemberRepository memberRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 이미 인증되어 있지 않은 경우에만 토큰을 본다(불필요한 DB 조회 방지).
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            cookieProvider.extractAccessToken(request)
                    .filter(token -> jwtProvider.isType(token, TokenType.ACCESS)) // 액세스 토큰만 허용
                    .filter(jwtProvider::isValid)                                  // 서명/만료 검증
                    .map(jwtProvider::getMemberId)
                    .flatMap(memberRepository::findById)                           // DB에서 회원 로드
                    .ifPresent(this::authenticate);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(Member member) {
        AirdndUserDetails principal = new AirdndUserDetails(member);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
