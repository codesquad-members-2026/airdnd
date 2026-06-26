package codesquad.airdnd.domain.listing.dto.response;

import codesquad.airdnd.domain.member.Member;

public record HostInfo(
	Long hostId,
	String name,
	String profileUrl
) {
	public static HostInfo from(Member host) {
		return new HostInfo(host.getId(), host.getNickname(), host.getProfileUrl());
	}
}
