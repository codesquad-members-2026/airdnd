package codesquad.airdnd.domain.payment.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderId;

    private String paymentKey;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(nullable = false, unique = true)
    private Long reservationId;

    private String method;

    private LocalDateTime approvedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime canceledAt;
    private String cancelReason;

    @Builder(access = AccessLevel.PRIVATE)
    private Payment(String orderId, BigDecimal amount, Long reservationId) {
        this.orderId = orderId;
        this.amount = amount;
        this.reservationId = reservationId;
        this.status = PaymentStatus.READY;   // Payment 생성 시 READY가 디폴트
        this.createdAt = LocalDateTime.now();
    }

    public static Payment ready(String orderId, BigDecimal amount, Long reservationId) {
        return Payment.builder()
                .orderId(orderId)
                .amount(amount)
                .reservationId(reservationId)
                .build();
    }

    public boolean isReady() {
        return this.status.equals(PaymentStatus.READY);
    }
    public boolean isDone(){
        return this.status.equals(PaymentStatus.DONE);
    }
    public boolean isEqualAmount(BigDecimal amount) {
        return this.amount.compareTo(amount) == 0;
    }
    public boolean isRefunded(){
        return this.status.equals(PaymentStatus.REFUNDED);
    }

    public void complete(String paymentKey, String method, LocalDateTime localDateTime){
        this.paymentKey = paymentKey;
        this.method = method;
        this.approvedAt = localDateTime;
        this.status = PaymentStatus.DONE; // 승인 완료
    }
    public void cancel(){
        this.status = PaymentStatus.CANCELED;
    }
    public void refund(String cancelReason, LocalDateTime canceledAt){
        this.cancelReason = cancelReason;
        this.canceledAt = canceledAt;
        this.status = PaymentStatus.REFUNDED;
    }
}
