package com.airdnd.user;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.wishlist.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository repository;
    private final WishlistService wishlistService;

    public Member findOrCreateOAuthMember(String provider, String oauthId, String email, String nickname){
        return repository.findByOauthProviderAndOauthId(provider, oauthId)
                .orElseGet(() -> wishlistService.createDefaultWishlist(repository.save(
                        new Member(null, email, nickname, MemberRoles.GUEST, provider, oauthId, false)
                )));
    }

    public Member getCurrentMember(Long id) {
        return repository.findById(id)
                .orElseThrow(()-> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public Member getHostActivationById(Long memberId){

        Member targetMember = repository.findById(memberId)
                .orElseThrow(()-> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if(targetMember.getRole() != MemberRoles.GUEST){
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
        }

        targetMember.activateHost();
        return repository.save(targetMember);
    }
}
