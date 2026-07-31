package com.airdnd.reservation.dto;

// 게스트 예약 목록 탭 배지용 카운트 요약. 키 이름이 프론트 zod 스키마와 1:1로 일치해야 한다.
public record GuestReservationCountsResponse(
        long upcoming,
        long past,
        long cancelled
) {
}
