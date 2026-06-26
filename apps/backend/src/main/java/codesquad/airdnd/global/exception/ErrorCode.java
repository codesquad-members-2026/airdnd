package codesquad.airdnd.global.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

	// ===== Common =====
	INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_001", "서버 내부 오류"),
	INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "COMMON_002","입력값이 올바르지 않습니다." ),

    // ==== MEMBER ====
    MEMBER_NOT_FOUND(HttpStatus.UNAUTHORIZED, "MEMBER_001", "존재하지 않는 회원입니다."),

    // ==== Wishlist ====
    WISHLIST_NOT_FOUND(HttpStatus.NOT_FOUND, "WISHLIST_001", "존재하지 않는 위시리스트 입니다."),
    WISHLIST_ITEM_ALREADY_EXISTS(HttpStatus.CONFLICT, "WISHLIST_002", "이미 위시리스트에 담긴 숙소입니다."),
    WISHLIST_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "WISHLIST_003", "위시리스트에 존재하지 않는 리스팅입니다."),

	// ===== Listing =====
	LISTING_NOT_FOUND(HttpStatus.NOT_FOUND, "LISTING_001", "숙소를 찾을 수 없습니다."),
	NOT_LISTING_OWNER(HttpStatus.FORBIDDEN, "LISTING_002" ,"숙소 접근 권한이 없습니다." ),
	LISTING_NOT_APPROVED(HttpStatus.CONFLICT, "LISTING_003", "승인되지 않은 숙소입니다."),
	INVALID_LOCATION(HttpStatus.BAD_REQUEST, "LISTING_004", "서비스 지역(대한민국) 외의 좌표입니다."),
	GEOCODING_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "LISTING_005", "주소 변환에 실패했습니다."),

	// ===== Reservation =====
	INVALID_RESERVATION_DATE(HttpStatus.BAD_REQUEST, "RESERVATION_001", "예약 날짜가 올바르지 않습니다."),
	ALREADY_RESERVED(HttpStatus.CONFLICT, "RESERVATION_002", "선택하신 날짜는 이미 예약되었습니다."),
	RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "RESERVATION_003", "존재하지 않는 예약입니다."),
	NOT_RESERVATION_OWNER(HttpStatus.FORBIDDEN, "RESERVATION_004","예약 접근 권한이 없습니다."),
	RESERVATION_NOT_CANCELABLE(HttpStatus.CONFLICT, "RESERVATION_005", "현재 상태에서는 예약을 취소할 수 없습니다."),
	;
	private final HttpStatus httpStatus;
	private final String code;
	private final String message;
}
