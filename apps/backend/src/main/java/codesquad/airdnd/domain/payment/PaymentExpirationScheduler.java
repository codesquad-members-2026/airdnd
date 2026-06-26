package codesquad.airdnd.domain.payment;

import codesquad.airdnd.domain.payment.entity.Payment;
import codesquad.airdnd.domain.payment.entity.PaymentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentExpirationScheduler {

    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    @Scheduled(fixedDelay = 60_000)
    public void sweepExpiredPayments() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);

        List<Payment> expired = paymentRepository.findByStatusAndCreatedAtBefore(PaymentStatus.READY, threshold);

        for(Payment payment : expired) {
            try {
                paymentService.expire(payment.getId());
            } catch (Exception e){
                log.warn("결제 만료 처리 실패: paymentId={}", payment.getId(), e);
            }
        }
    }
}
