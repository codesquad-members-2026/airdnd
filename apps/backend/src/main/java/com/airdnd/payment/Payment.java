package com.airdnd.payment;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String paypalOrderId;

    @Column(nullable = false)
    private Long reservationId;

    @Column(nullable = false)
    private BigDecimal paypalAmount;

    @Column(nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder
    private Payment(String paypalOrderId, Long reservationId, BigDecimal paypalAmount,
                    String currency, PaymentStatus status, LocalDateTime createdAt) {
        this.paypalOrderId = paypalOrderId;
        this.reservationId = reservationId;
        this.paypalAmount = paypalAmount;
        this.currency = currency;
        this.status = status;
        this.createdAt = createdAt;
    }

    public void markCapturing() {
        this.status = PaymentStatus.CAPTURING;
        this.updatedAt = LocalDateTime.now();
    }

    public void markCaptured() {
        this.status = PaymentStatus.CAPTURED;
        this.updatedAt = LocalDateTime.now();
    }

    public void markRefundRequired() {
        this.status = PaymentStatus.REFUND_REQUIRED;
        this.updatedAt = LocalDateTime.now();
    }

    public void markFailed() {
        this.status = PaymentStatus.FAILED;
        this.updatedAt = LocalDateTime.now();
    }
}
