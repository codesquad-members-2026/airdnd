package codesquad.airdnd.domain.member;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;

    private String password;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    @Column(name = "oauth_id")
    private String oauthId;

    @Column(name = "profile_url")
    private String profileUrl;

    @Column(name = "refresh_token")
    private String refreshToken;

    @Builder
    protected Member(
            String userId, String password, String nickname, String oauthProvider,
            String oauthId, String profileUrl, String refreshToken) {

        this.userId = userId;
        this.password = password;
        this.nickname = nickname;
        this.oauthProvider = oauthProvider;
        this.oauthId = oauthId;
        this.profileUrl = profileUrl;
        this.refreshToken = refreshToken;
    }

    /**
     * 소셜 로그인(OAuth)으로 처음 들어온 사용자를 위한 회원 생성 팩토리.
     * userId/password는 없고(자체 로그인 불가) provider/oauthId로 식별한다.
     *
     * @param provider   소셜 제공자 식별자(예: "google")
     * @param oauthId    제공자가 부여한 고유 사용자 식별자(Google의 sub)
     * @param nickname   표시 이름(중복 시 호출 측에서 보정)
     * @param profileUrl 프로필 이미지 URL(nullable)
     */
    public static Member ofOAuth(String provider, String oauthId, String nickname, String profileUrl) {
        return Member.builder()
                .oauthProvider(provider)
                .oauthId(oauthId)
                .nickname(nickname)
                .profileUrl(profileUrl)
                .build();
    }

    /**
     * 리프레시 토큰을 저장/갱신한다. (로그인·토큰 재발급 시 호출, JPA 더티 체킹으로 반영)
     */
    public void updateRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    /**
     * 저장된 리프레시 토큰을 제거한다. (로그아웃 시 서버 측 토큰 무효화)
     */
    public void clearRefreshToken() {
        this.refreshToken = null;
    }
}
