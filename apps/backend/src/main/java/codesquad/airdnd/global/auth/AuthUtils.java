package codesquad.airdnd.global.auth;

import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthUtils {

    private final MemberRepository memberRepository;

    // TODO: 현재 사용자를 필요로 하는 곳에서 사용하면 됩니다
    public Member getCurrentMember(){
        return memberRepository.findById(1L)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }
}
