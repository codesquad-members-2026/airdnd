package com.airdnd.payment;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PaymentReconciliationSweeper {

    private static final Logger log = LoggerFactory.getLogger(PaymentReconciliationSweeper.class);
    // CAPTURING ㅅ ㅏㅇ 태로 3초 이상 지나면 문제있는 요청으로 필터함 API 요청이 지연될 경우 늘리거나
    // 근본적으로 락 자체를 유지하면 안됨
    private static final int STUCK_MINUTES = 3;

    private final PaymentRepository paymentRepository;
    private final PaymentReconciliationService reconciliationService;

    @Scheduled(fixedDelay = 60000)
    public void reconcileStuckCaptures() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(STUCK_MINUTES);
        List<Payment> stuck = paymentRepository.findByStatusAndUpdatedAtBefore(PaymentStatus.CAPTURING, threshold);
        if (stuck.isEmpty()) {
            return;
        }
        log.info("Reconciling {} stuck CAPTURING payment(s)", stuck.size());
        for (Payment payment : stuck) {
            try {
                reconciliationService.reconcileOne(payment.getId());
            } catch (Exception e) {
                log.error("Failed to reconcile payment {}: {}", payment.getId(), e.getMessage(), e);
            }
        }
    }
}
