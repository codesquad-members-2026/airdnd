package com.airdnd.user;

import com.airdnd.auth.AuthMemberPrincipal;
import com.airdnd.auth.SessionReAuthenticator;
import com.airdnd.user.dto.CurrentUserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MemberController {
    private final MemberService service;
    private final SessionReAuthenticator reAuthenticator;

    @GetMapping("/auth/me")
    public ResponseEntity<CurrentUserResponse> getCurrentUserInfo(@AuthenticationPrincipal AuthMemberPrincipal principal){
       Member targetMember = service.getCurrentMember(principal.getMemberId());
       return ResponseEntity.ok(CurrentUserResponse.of(targetMember, principal.getAvatarUrl()));
    }

    @PostMapping("/members/me/host-activation")
    public ResponseEntity<CurrentUserResponse> getHostActivation(@AuthenticationPrincipal AuthMemberPrincipal principal,
                                                                 HttpServletRequest request,
                                                                 HttpServletResponse response){
        Member member = service.getHostActivationById(principal.getMemberId());
        AuthMemberPrincipal newPrincipal = principal.updateAndGenerateNewPrincipal(member);
        reAuthenticator.refresh(newPrincipal, request, response);
        return ResponseEntity.ok(CurrentUserResponse.of(member,principal.getAvatarUrl()));
    }
}
