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
}
