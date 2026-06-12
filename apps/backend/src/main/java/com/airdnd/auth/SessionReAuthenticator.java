package com.airdnd.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SessionReAuthenticator {
    private final SecurityContextRepository securityContextRepository;

    public void refresh(AuthMemberPrincipal newPrincipal,
                        HttpServletRequest request,
                        HttpServletResponse response){
        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        String regId =  ((OAuth2AuthenticationToken) currentAuth).getAuthorizedClientRegistrationId();

        OAuth2AuthenticationToken newToken = new OAuth2AuthenticationToken(
                newPrincipal,
                newPrincipal.getAuthorities(),
                regId
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(newToken);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context,request,response);
    }
}
