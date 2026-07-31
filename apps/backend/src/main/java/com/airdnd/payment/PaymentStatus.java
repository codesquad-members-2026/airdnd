package com.airdnd.payment;

public enum PaymentStatus {
    CREATED,          // PayPal 페이먼트 생성됨, 아직 capture 시도 전
    CAPTURING,        // capture 시도 시작하면서 기록(롤백에도 살아남는 내구 마커). 오랫동안 남으면 스위퍼로 처리
    CAPTURED,         // PayPal 결제 완료 + 예약 확정됨
    REFUND_REQUIRED,  // 결제는 됐으나 예약을 확정할 수 없음 → 환불 필요(수동/후속 처리)
    FAILED            // capture 가 끝내 이뤄지지 않음(미결제로 종료)
}
