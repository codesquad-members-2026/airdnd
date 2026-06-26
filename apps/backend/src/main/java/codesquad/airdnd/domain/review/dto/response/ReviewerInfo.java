package codesquad.airdnd.domain.review.dto.response;

import codesquad.airdnd.domain.member.Member;

public record ReviewerInfo(
	Long id,
	String nickname,
	String profileUrl
) {
	public static ReviewerInfo from(Member member) {
		return new ReviewerInfo(member.getId(), member.getNickname(), member.getProfileUrl());
	}
}
