package com.airdnd.auth;

import com.airdnd.user.Member;
import com.airdnd.user.MemberRoles;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

import java.util.Collection;
import java.util.List;

@Getter
public class AuthMemberPrincipal extends DefaultOidcUser {
    private final Long memberId;
    private final String email;
    private final String nickname;
    private final MemberRoles role;
    private final String avatarUrl;

    public AuthMemberPrincipal(
            Collection<? extends GrantedAuthority> authorities,
            OidcIdToken idToken,
            OidcUserInfo userInfo,
            Long memberId,
            String email,
            String nickname,
            MemberRoles role,
            String avatarUrl
    ){
        super(authorities, idToken, userInfo, "sub");
        this.memberId = memberId;
        this.email = email;
        this.nickname = nickname;
        this.role = role;
        this.avatarUrl = avatarUrl;
    }


    public AuthMemberPrincipal updateAndGenerateNewPrincipal(Member updatedMember){
        return new AuthMemberPrincipal(
                List.of(new SimpleGrantedAuthority("ROLE_"+updatedMember.getRole())),
                this.getIdToken(),
                this.getUserInfo(),
                this.getMemberId(),
                this.getEmail(),
                this.getNickname(),
                updatedMember.getRole(),
                this.getAvatarUrl());
    }

}
