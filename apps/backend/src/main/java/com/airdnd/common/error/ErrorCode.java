package com.airdnd.common.error;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "요청 형식이 유효하지 않습니다"),
    UNAUTHORIZED_ACTION(HttpStatus.UNAUTHORIZED, "권한이 없는 요청은 수행할 수 없습니다"),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "요청하신 유저 정보를 찾을 수 없습니다"),
    ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "요청하신 숙소 정보를 찾을 수 없습니다"),
    ROOM_CAPACITY_EXCEEDED(HttpStatus.BAD_REQUEST, "숙소 최대 수용 인원을 초과했습니다"),
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "요청하신 예약 정보를 찾을 수 없습니다"),
    RESERVATION_NOT_PAYABLE(HttpStatus.CONFLICT, "결제할 수 없는 예약입니다 (이미 처리되었거나 대기 시간이 만료되었습니다)"),
    INVALID_RESERVATION_DATE(HttpStatus.BAD_REQUEST, "체크인 날짜는 체크아웃 날짜보다 앞서야 합니다"),
    ROOM_ALREADY_BOOKED(HttpStatus.CONFLICT, "선택하신 날짜에는 이미 예약이 존재합니다"),
    RESERVATION_LOCK_TIMEOUT(HttpStatus.CONFLICT, "예약 요청이 많아 처리하지 못했습니다. 잠시 후 다시 시도해 주세요"),
    WISHLIST_NOT_FOUND(HttpStatus.NOT_FOUND, "요청하신 위시리스트가 존재하지 않습니다"),
    WISHLIST_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 같은 위시리스트가 존재합니다"),
    WISHLIST_ROOM_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 같은 숙소가 위시리스트 내에 존재합니다"),
    WISHLIST_BELONG_TO_OTHERS(HttpStatus.UNAUTHORIZED, "본인의 위시리스트만 수정할 수 있습니다"),
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "결제 정보를 찾을 수 없습니다"),
    PAYMENT_ALREADY_CAPTURED(HttpStatus.CONFLICT, "이미 결제가 완료된 주문입니다"),
    PAYMENT_CREATION_FAILED(HttpStatus.BAD_GATEWAY, "결제 주문 생성에 실패했습니다"),
    PAYMENT_CAPTURE_FAILED(HttpStatus.BAD_GATEWAY, "결제 승인에 실패했습니다"),
    REVIEW_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 예약에 대한 리뷰가 작성되어 있습니다"),
    REVIEW_NOT_ELIGIBLE(HttpStatus.BAD_REQUEST, "체크아웃이 완료된 예약에만 후기를 작성할 수 있습니다"),
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "요청하신 알림을 찾을 수 없습니다"),
    PETS_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "애완 동물은 허용되지 않습니다"),
    INFANTS_NOT_ALLOWED(HttpStatus.BAD_REQUEST,"유아 동반이 허용되지 않습니다");


    private final HttpStatus status;
    private final String errorMessage;

    ErrorCode(HttpStatus status, String errorMessage){
        this.status = status;
        this.errorMessage = errorMessage;
    }

}
