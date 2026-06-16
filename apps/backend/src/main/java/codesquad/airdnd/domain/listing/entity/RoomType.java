package codesquad.airdnd.domain.listing.entity;

import lombok.Getter;

@Getter
public enum RoomType {
	ENTIRE_PLACE,   // 집 전체
	PRIVATE_ROOM,   // 개인실
	SHARED_ROOM,    // 다인실 (공용 공간)
	;
}
