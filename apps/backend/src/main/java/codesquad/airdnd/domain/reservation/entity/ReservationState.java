package codesquad.airdnd.domain.reservation.entity;

public enum ReservationState {
	PENDING, // 진행중
	CONFIRMED, // 확정됨
	GUEST_CANCELED, // 게스트가 취소함
	HOST_CANCELED, // 호스트가 취소함
	COMPLETED // 완료됨
}
