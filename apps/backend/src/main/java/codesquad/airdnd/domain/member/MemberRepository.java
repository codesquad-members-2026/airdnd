package codesquad.airdnd.domain.member;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByUserId(String userId);

    // 소셜 로그인 시 (provider, oauthId)로 기존 회원을 식별 (V1 스키마의 uk_member_oauth 유니크 키와 대응)
    Optional<Member> findByOauthProviderAndOauthId(String oauthProvider, String oauthId);

    boolean existsByUserId(String userId);

    boolean existsByNickname(String nickname);
}
