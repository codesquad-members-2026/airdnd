package codesquad.airdnd.domain.payment;

import codesquad.airdnd.domain.payment.entity.Payment;
import codesquad.airdnd.domain.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByReservationId(Long reservationId);

    Optional<Payment> findByOrderId(String orderId);

    List<Payment> findByStatusAndCreatedAtBefore(PaymentStatus status, LocalDateTime threshold);
}
