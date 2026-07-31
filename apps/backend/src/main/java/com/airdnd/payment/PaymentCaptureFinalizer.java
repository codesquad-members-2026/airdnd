package com.airdnd.payment;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.reservation.Reservation;
import com.airdnd.reservation.ReservationService;
import com.airdnd.reservation.ReservationService.CaptureFinalizeResult;
import com.airdnd.reservation.event.ReservationConfirmedEvent;
import com.airdnd.room.Room;
import com.airdnd.room.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 결제 capture 3단계(마감): PayPal 과금이 끝난 뒤, 짧은 트랜잭션 안에서
 * Room 락을 잠깐 잡아 예약을 확정하고 결제를 CAPTURED 로 마감한다.
 * 락을 PayPal 호출 동안 쥐지 않으므로(2단계가 락 밖), 여기서의 락 점유는 수 ms 에 그친다.
 *
 * 확정 로직은 스위퍼 복구 경로와 동일한 {@link ReservationService#lockAndConfirmForReconciliation}
 * 를 재사용한다(happy-path 와 복구 경로의 확정 의미를 일치시킨다).
 */
@Component
@RequiredArgsConstructor
public class PaymentCaptureFinalizer {

    private final PaymentRepository paymentRepository;
    private final ReservationService reservationService;
    private final RoomRepository roomRepository;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final PaymentCaptureMarker paymentCaptureMarker;

    @Transactional
    public void finalizeCapture(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
        if (payment.getStatus() == PaymentStatus.CAPTURED) {
            return; // 이미 마감됨(스위퍼 등 다른 실행이 처리) → 멱등
        }
        Reservation reservation = reservationService.findReservationById(payment.getReservationId());

        CaptureFinalizeResult result =
                reservationService.lockAndConfirmForReconciliation(reservation.getId());
        switch (result) {
            case CONFIRMED, ALREADY_CONFIRMED -> {
                payment.markCaptured();
                Room room = roomRepository.findById(reservation.getRoomId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
                applicationEventPublisher.publishEvent(new ReservationConfirmedEvent(
                        reservation.getId(), reservation.getGuestId(), room.getHostId(),room.getId(), room.getName(),
                        reservation.getCheckInDate(), reservation.getCheckOutDate()));
            }
            case UNFULFILLABLE -> {
                // 과금됐지만 방을 줄 수 없음 → 이 트랜잭션이 롤백돼도 환불 표시는 남기고 실패를 알린다.
                paymentCaptureMarker.markRefundRequired(payment.getId());
                throw new BusinessException(ErrorCode.PAYMENT_CAPTURE_FAILED,
                        "환불 필요: 결제는 완료됐으나 방을 확정할 수 없습니다");
            }
        }
    }
}
