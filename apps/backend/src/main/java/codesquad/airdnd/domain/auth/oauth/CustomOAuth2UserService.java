package codesquad.airdnd.domain.auth.oauth;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import lombok.RequiredArgsConstructor;

/**
 * 소셜 로그인(B 흐름)의 회원 매핑 담당.
 *
 * <p>Spring Security가 Google 토큰으로 사용자 정보를 받아오면 이 서비스가 호출된다.
 * 받은 프로필을 우리 {@link Member}로 find-or-create 하여 {@link OAuth2UserPrincipal}로 감싸 반환한다.
 * (이후 성공 핸들러가 이 회원으로 우리 JWT를 발급 → "구글로 인증, 내 서버가 내 토큰 발급"하는 하이브리드 구조)</p>
 */
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final MemberRepository memberRepository;

    /**
     * Google 프로필을 우리 회원으로 매핑한다.
     *
     * @param userRequest 액세스 토큰 + 클라이언트 등록 정보(registrationId 등)
     * @return 우리 회원을 담은 {@link OAuth2UserPrincipal}
     */
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        // 1) 기본 구현이 UserInfo 엔드포인트를 호출해 프로필 attributes를 가져온다.
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 2) 제공자 식별자(예: "google") + 프로필로 우리 회원 매핑.
        String provider = userRequest.getClientRegistration().getRegistrationId();
        return toPrincipal(provider, oAuth2User.getAttributes());
    }

    /**
     * Google 프로필 attributes를 우리 회원으로 find-or-create 하여 principal로 감싼다.
     * (네트워크 의존이 없어 단위 테스트가 가능하도록 loadUser에서 분리)
     *
     * @param provider   제공자 식별자
     * @param attributes UserInfo 프로필 맵(sub/email/name/picture)
     */
    OAuth2UserPrincipal toPrincipal(String provider, Map<String, Object> attributes) {
        String oauthId = (String) attributes.get("sub");        // Google 고유 사용자 ID
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");

        // (provider, oauthId)로 기존 회원을 찾고 없으면 새로 가입시킨다. 신규 가입 여부를 함께 표시한다.
        Optional<Member> found = memberRepository.findByOauthProviderAndOauthId(provider, oauthId);
        boolean isNewUser = found.isEmpty();
        Member member = found.orElseGet(() -> memberRepository.save(
                Member.ofOAuth(provider, oauthId, resolveNickname(name, email), picture)));

        return new OAuth2UserPrincipal(member, attributes, isNewUser);
    }

    /**
     * 표시용 닉네임을 정한다. name → email 로컬파트 순으로 후보를 잡고,
     * nickname 유니크 제약과 충돌하면 짧은 무작위 접미사를 붙여 회피한다.
     */
    private String resolveNickname(String name, String email) {
        String base = (name != null && !name.isBlank())
                ? name
                : (email != null ? email.split("@")[0] : "user");

        String candidate = base;
        while (memberRepository.existsByNickname(candidate)) {
            candidate = base + "_" + UUID.randomUUID().toString().substring(0, 6);
        }
        return candidate;
    }
}
