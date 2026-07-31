package com.airdnd.reservation;

// 게스트 예약 목록 탭. 날짜 기반 파생 그룹이라 status 컬럼과 1:1이 아니다.
// UPCOMING  : 취소 아님 + 체크아웃이 오늘 이후(checkIn 오름차순)
// PAST      : 취소 아님 + 체크아웃이 오늘 이전(checkOut 내림차순)
// CANCELLED : 상태가 CANCELLED(checkOut 내림차순)
public enum GuestReservationTab {
    UPCOMING,
    PAST,
    CANCELLED
}
