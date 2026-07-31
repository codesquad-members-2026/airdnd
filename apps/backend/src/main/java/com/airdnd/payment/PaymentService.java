package com.airdnd.payment;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.config.PaypalProperties;
import com.airdnd.payment.dto.CaptureResponse;
import com.airdnd.payment.dto.PaymentOrderRequest;
import com.airdnd.reservation.Reservation;
import com.airdnd.reservation.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final PaypalClient paypalClient;
    private final PaypalProperties paypalProperties;
    private final ReservationService reservationService;
    private final PaymentCaptureMarker paymentCaptureMarker;
    private final PaymentCaptureFinalizer paymentCaptureFinalizer;


    @Transactional
    public String createOrder(PaymentOrderRequest request, Long guestId) {
        Reservation reservation = reservationService.getPayableHold(request.reservationId(), guestId);

        BigDecimal paypalAmount = BigDecimal.valueOf(reservation.getTotalPrice())
                .divide(paypalProperties.exchangeRate(), 2, RoundingMode.HALF_UP);

        String orderId = paypalClient.createOrder(paypalAmount);

        Payment payment = Payment.builder()
                .paypalOrderId(orderId)
                .reservationId(reservation.getId())
                .paypalAmount(paypalAmount)
                .currency(paypalProperties.currency())
                .status(PaymentStatus.CREATED)
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        return orderId;
    }

    /**
     * 결제 capture 를 세 단계로 분해한다. 핵심은 <b>Room 락을 PayPal 호출 동안 쥐지 않는 것</b>이다.
     * 오케스트레이터 자신은 트랜잭션이 아니며, 각 단계가 독립된 짧은 트랜잭션이다.
     *
     * <ol>
     *   <li>사전 검증(읽기): 결제 존재·소유자·중복 capture</li>
     *   <li>1단계(짧은 트랜잭션): Room 락으로 점유 재검증 + CAPTURING 마킹 → 커밋과 함께 락 해제.
     *       PENDING 홀드가 슬롯을 선점하므로 락 없이도 다른 예약/결제가 같은 날짜를 못 가져간다.</li>
     *   <li>2단계(락 없음): 외부 PayPal capture. 더 이상 Room 락을 쥐지 않으므로 같은 방의 동시 요청을 막지 않는다.</li>
     *   <li>3단계(짧은 트랜잭션): 예약 확정 + 결제 CAPTURED + 확정 이벤트.</li>
     * </ol>
     * 2단계 직후 프로세스가 죽어도 결제는 CAPTURING(REQUIRES_NEW)으로 남아 스위퍼가 복구한다.
     */
    public CaptureResponse capture(String orderId, Long guestId) {
        Payment payment = paymentRepository.findByPaypalOrderId(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        Reservation reservation = reservationService.findReservationById(payment.getReservationId());
        if (!reservation.getGuestId().equals(guestId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
        }
        if (payment.getStatus().equals(PaymentStatus.CAPTURED)) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_CAPTURED);
        }

        // 1단계: 방 점유 재검증 + CAPTURING 마킹(락은 이 단계 커밋과 함께 풀린다).
        reservationService.lockAndPrepareForCapture(reservation.getId());
        paymentCaptureMarker.markCapturing(payment.getId());

        // 2단계: 외부 PayPal capture — Room 락 밖에서 수행한다.
        paypalClient.captureOrder(orderId);

        // 3단계: 짧은 락으로 확정 + 결제 마감 + 이벤트.
        paymentCaptureFinalizer.finalizeCapture(payment.getId());

        return new CaptureResponse(payment.getReservationId());
    }
}
