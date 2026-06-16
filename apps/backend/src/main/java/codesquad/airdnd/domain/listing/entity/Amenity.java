package codesquad.airdnd.domain.listing.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Amenity {

	KITCHEN("주방"),
	WIFI("무선 인터넷"),
	AIR_CONDITIONER("에어컨"),
	HAIR_DRYER("헤어드라이어"),
	WASHING_MACHINE("세탁기"),
	FREE_PARKING("무료 주차"),
	TV("TV"),
	SWIMMING_POOL("수영장"),
	PET_ALLOWED("반려동물 동반 가능"),
	BREAKFAST_INCLUDED("조식 포함"),
	GYM("헬스장"),
	ELEVATOR("엘리베이터");

	private final String label;
}