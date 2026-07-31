package com.airdnd.payment;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.reservation.ReservationService;
import com.airdnd.reservation.ReservationService.CaptureFinalizeResult;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentReconciliationService {

    private static final Logger log = LoggerFactory.getLogger(PaymentReconciliationService.class);
    private static final String PAYPAL_COMPLETED = "COMPLETED";

    private final PaymentRepository paymentRepository;
    private final PaypalClient paypalClient;
    private final ReservationService reservationService;


    @Transactional
    public void reconcileOne(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
        if (payment.getStatus() != PaymentStatus.CAPTURING) {
            return; // 다른 실행/요청이 이미 처리함
        }

        String orderStatus = paypalClient.getOrderStatus(payment.getPaypalOrderId());
        if (!PAYPAL_COMPLETED.equals(orderStatus)) {
            // 과금된 적이 없음(승인만 됐거나 만료/취소) → 종료 처리
            payment.markFailed();
            log.info("Reconciled payment {} -> FAILED (PayPal order status={})", paymentId, orderStatus);
            return;
        }

        // 과금됨 → 방 점유 재검증 후 확정
        CaptureFinalizeResult result =
                reservationService.lockAndConfirmForReconciliation(payment.getReservationId());
        switch (result) {
            case CONFIRMED, ALREADY_CONFIRMED -> {
                payment.markCaptured();
                log.info("Reconciled payment {} -> CAPTURED (reservation {}, {})",
                        paymentId, payment.getReservationId(), result);
            }
            case UNFULFILLABLE -> {
                payment.markRefundRequired();
                log.error("Payment {} captured at PayPal but reservation {} is no longer fulfillable. REFUND REQUIRED.",
                        paymentId, payment.getReservationId());
            }
        }
    }
}
