package codesquad.airdnd.domain.auth;

import codesquad.airdnd.domain.auth.dto.SignupRequest;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Long signup(SignupRequest request) {
        if(memberRepository.existsByUserId(request.userId())){
            throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_USER_ID);
        }

        if(memberRepository.existsByNickname(request.nickname())){
            throw new BusinessException(ErrorCode.MEMBER_DUPLICATE_NICKNAME);
        }

        Member member = Member.builder()
                .userId(request.userId())
                .password(passwordEncoder.encode(request.password()))
                .nickname(request.nickname())
                .build();

        return memberRepository.save(member).getId();
    }
}
