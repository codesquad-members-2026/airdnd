package codesquad.airdnd.domain.auth.oauth;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import codesquad.airdnd.domain.member.Member;
import lombok.RequiredArgsConstructor;

/**
 * 소셜 로그인 성공 시 SecurityContext에 들어가는 principal.
 *
 * <p>{@link CustomOAuth2UserService}가 find-or-create로 확정한 {@link Member}를 들고 있으므로,
 * 성공 핸들러({@code OAuth2SuccessHandler})에서 회원 정보를 그대로 꺼내 JWT를 발급할 수 있다.</p>
 */
@Getter
@RequiredArgsConstructor
public class OAuth2UserPrincipal implements OAuth2User {

    private final Member member;
    private final Map<String, Object> attributes;

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    /**
     * principal 식별자. 회원 PK를 문자열로 반환한다.
     */
    @Override
    public String getName() {
        return String.valueOf(member.getId());
    }
}
