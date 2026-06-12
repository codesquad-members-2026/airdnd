package com.airdnd.user.dto;

public record MemberResponse(
        Long id,
        String email,
        String nickName,
        String role,
        String oauthProvider,
        String oauthId,
        boolean isDeleted
) { }
