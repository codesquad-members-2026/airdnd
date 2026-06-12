package com.airdnd.auth;

import com.airdnd.user.Member;
import com.airdnd.user.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OAuthService extends OidcUserService {
    private final MemberService service;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest){
        OidcUser user = super.loadUser(userRequest);
        String provider = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        String oauthId = user.getSubject();
        String email = user.getEmail();
        String nickname = user.getFullName();
        String avatarUrl = user.getPicture();

        Member member = service.findOrCreateOAuthMember(provider, oauthId, email, nickname);

        return new AuthMemberPrincipal(
                List.of(new SimpleGrantedAuthority("ROLE_" + member.getRole())),
                user.getIdToken(),
                user.getUserInfo(),
                member.getId(),
                member.getEmail(),
                member.getNickname(),
                member.getRole(),
                avatarUrl
        );
    }
}
