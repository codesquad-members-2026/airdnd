package com.airdnd.payment;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PaymentCaptureMarker {

    private final PaymentRepository paymentRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markCapturing(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
        payment.markCapturing();
    }

    // 과금됐지만 방을 확정할 수 없는 경우, 마감 트랜잭션이 롤백되더라도 환불 필요 표시는 남겨야 한다.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markRefundRequired(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
        payment.markRefundRequired();
    }
}
