package codesquad.airdnd.domain.reservation.entity;

public enum CancelReason {
	GUEST_REQUESTED,      // 게스트가 취소를 요청했으나 호스트가 대신 처리
	MAINTENANCE_ISSUE,    // 시설 고장·하자 (보일러, 누수 등)
	UNAVAILABLE,          // 호스트 사정으로 숙소 제공 불가 (개인 사정, 일정 변경)
	SAFETY_CONCERN,       // 안전 문제 (자연재해, 시설 위험 등)
	OTHER                 // 기타
}
