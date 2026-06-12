package com.airdnd.user.dto;

import com.airdnd.auth.AuthMemberPrincipal;
import com.airdnd.user.Member;
import com.airdnd.user.MemberRoles;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CurrentUserResponse(
        Long id,
        String name,
        String email,
        MemberRoles role,
        String avatarUrl
) {
    public static CurrentUserResponse of(Member member, String avatarUrl){
        return new CurrentUserResponse(member.getId(),member.getNickname(),member.getEmail(),member.getRole(), avatarUrl);
    }
}
