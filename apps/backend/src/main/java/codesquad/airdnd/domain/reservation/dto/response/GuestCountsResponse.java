package codesquad.airdnd.domain.reservation.dto.response;

import codesquad.airdnd.domain.reservation.entity.GuestCounts;

public record GuestCountsResponse(
	int adultGuestNum,
	int childGuestNum,
	int babyGuestNum,
	int petGuestNum
) {
	public static GuestCountsResponse from(GuestCounts g) {
		return new GuestCountsResponse(
			g.getAdultGuestNum(),
			g.getChildGuestNum(),
			g.getBabyGuestNum(),
			g.getPetGuestNum()
		);
	}
}
