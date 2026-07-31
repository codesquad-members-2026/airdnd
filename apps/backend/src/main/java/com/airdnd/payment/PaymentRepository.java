package com.airdnd.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaypalOrderId(String orderId);

    // 정산 대상: 일정 시간 이상 CAPTURING 에 멈춰 있는 결제(과금 후 미확정 가능성).
    List<Payment> findByStatusAndUpdatedAtBefore(PaymentStatus status, LocalDateTime threshold);
}
