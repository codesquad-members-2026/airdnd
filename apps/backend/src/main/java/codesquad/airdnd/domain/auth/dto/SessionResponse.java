package codesquad.airdnd.domain.auth.dto;

import codesquad.airdnd.domain.member.Member;

public record SessionResponse (
        boolean authenticated,
        Long memberId,
        String userId,
        String nickname
){

    public static SessionResponse of(Member member){
        return new SessionResponse(true, member.getId(), member.getUserId(), member.getNickname());
    }

    public static SessionResponse anonymous(){
        return new SessionResponse(false, null, null, null);
    }
}
