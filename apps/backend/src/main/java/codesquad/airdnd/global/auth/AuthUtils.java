package codesquad.airdnd.global.auth;

import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.global.auth.security.AirdndUserDetails;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthUtils {

    public Member getCurrentMember() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication == null
            || !(authentication.getPrincipal() instanceof AirdndUserDetails principal)){

            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        return principal.getMember();
    }
}
