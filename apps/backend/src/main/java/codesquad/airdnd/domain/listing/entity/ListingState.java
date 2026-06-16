package codesquad.airdnd.domain.listing.entity;

import lombok.Getter;

@Getter
public enum ListingState {
	PENDING,      // 요청됨 (승인 대기 중)
	APPROVED,     // 승인됨
	REJECTED,     // 반려됨 (승인 거부)
	INACTIVE,     // 비활성화됨
	;
}
