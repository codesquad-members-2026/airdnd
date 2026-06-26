package codesquad.airdnd.domain.auth.oauth;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;

/**
 * CustomOAuth2UserService의 find-or-create 매핑 단위 테스트.
 * (super.loadUser는 네트워크 의존이라, attributes→회원 매핑 로직인 toPrincipal을 직접 검증)
 */
@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private CustomOAuth2UserService service;

    private Map<String, Object> googleAttributes() {
        return Map.of(
                "sub", "google-sub-123",
                "email", "tester@gmail.com",
                "name", "테스터",
                "picture", "https://example.com/p.png"
        );
    }

    @Test
    @DisplayName("기존 OAuth 회원이 있으면 그대로 재사용한다(신규 저장 없음)")
    void reusesExistingMember() {
        Member existing = Member.ofOAuth("google", "google-sub-123", "테스터", null);
        ReflectionTestUtils.setField(existing, "id", 10L);
        given(memberRepository.findByOauthProviderAndOauthId("google", "google-sub-123"))
                .willReturn(Optional.of(existing));

        OAuth2UserPrincipal principal = service.toPrincipal("google", googleAttributes());

        assertThat(principal.getMember()).isSameAs(existing);
        assertThat(principal.isNewUser()).isFalse();
        then(memberRepository).should(never()).save(any());
    }

    @Test
    @DisplayName("처음 보는 OAuth 사용자는 새 회원으로 저장한다")
    void createsNewMember() {
        given(memberRepository.findByOauthProviderAndOauthId("google", "google-sub-123"))
                .willReturn(Optional.empty());
        given(memberRepository.existsByNickname("테스터")).willReturn(false);
        given(memberRepository.save(any(Member.class))).willAnswer(inv -> inv.getArgument(0));

        OAuth2UserPrincipal principal = service.toPrincipal("google", googleAttributes());

        Member saved = principal.getMember();
        assertThat(principal.isNewUser()).isTrue();
        assertThat(saved.getOauthProvider()).isEqualTo("google");
        assertThat(saved.getOauthId()).isEqualTo("google-sub-123");
        assertThat(saved.getNickname()).isEqualTo("테스터");
        assertThat(saved.getProfileUrl()).isEqualTo("https://example.com/p.png");
        then(memberRepository).should().save(any(Member.class));
    }

    @Test
    @DisplayName("닉네임이 이미 존재하면 접미사를 붙여 충돌을 피한다")
    void avoidsNicknameCollision() {
        given(memberRepository.findByOauthProviderAndOauthId(anyString(), anyString()))
                .willReturn(Optional.empty());
        // 첫 후보("테스터")는 충돌, 그 다음 후보는 통과
        given(memberRepository.existsByNickname("테스터")).willReturn(true);
        given(memberRepository.existsByNickname(argThat(n -> n.startsWith("테스터_")))).willReturn(false);
        given(memberRepository.save(any(Member.class))).willAnswer(inv -> inv.getArgument(0));

        OAuth2UserPrincipal principal = service.toPrincipal("google", googleAttributes());

        assertThat(principal.getMember().getNickname())
                .startsWith("테스터_")
                .isNotEqualTo("테스터");
    }
}
