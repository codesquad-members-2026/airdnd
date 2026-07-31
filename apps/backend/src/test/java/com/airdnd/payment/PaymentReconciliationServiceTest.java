package com.airdnd.payment;

import com.airdnd.reservation.ReservationService;
import com.airdnd.reservation.ReservationService.CaptureFinalizeResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PaymentReconciliationServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PaypalClient paypalClient;
    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private PaymentReconciliationService reconciliationService;

    private static final Long PAYMENT_ID = 5L;
    private static final Long RESERVATION_ID = 42L;
    private static final String ORDER_ID = "PP-ORDER-1";

    private Payment payment;

    @BeforeEach
    void setUp() {
        payment = Payment.builder()
                .paypalOrderId(ORDER_ID)
                .reservationId(RESERVATION_ID)
                .paypalAmount(new BigDecimal("200.00"))
                .currency("USD")
                .status(PaymentStatus.CAPTURING)
                .createdAt(LocalDateTime.now())
                .build();
        ReflectionTestUtils.setField(payment, "id", PAYMENT_ID);
    }

    @Test
    @DisplayName("정산: PayPal COMPLETED + 예약 확정 성공이면 CAPTURED 로 마감한다.")
    void reconcile_completedAndConfirmed_marksCaptured() {
        given(paymentRepository.findById(PAYMENT_ID)).willReturn(Optional.of(payment));
        given(paypalClient.getOrderStatus(ORDER_ID)).willReturn("COMPLETED");
        given(reservationService.lockAndConfirmForReconciliation(RESERVATION_ID))
                .willReturn(CaptureFinalizeResult.CONFIRMED);

        reconciliationService.reconcileOne(PAYMENT_ID);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CAPTURED);
    }

    @Test
    @DisplayName("정산: 이미 확정된 예약(ALREADY_CONFIRMED)도 CAPTURED 로 마감한다(멱등).")
    void reconcile_alreadyConfirmed_marksCaptured() {
        given(paymentRepository.findById(PAYMENT_ID)).willReturn(Optional.of(payment));
        given(paypalClient.getOrderStatus(ORDER_ID)).willReturn("COMPLETED");
        given(reservationService.lockAndConfirmForReconciliation(RESERVATION_ID))
                .willReturn(CaptureFinalizeResult.ALREADY_CONFIRMED);

        reconciliationService.reconcileOne(PAYMENT_ID);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CAPTURED);
    }

    @Test
    @DisplayName("정산: 과금됐지만 방을 줄 수 없으면(UNFULFILLABLE) REFUND_REQUIRED 로 표시한다.")
    void reconcile_completedButUnfulfillable_marksRefundRequired() {
        given(paymentRepository.findById(PAYMENT_ID)).willReturn(Optional.of(payment));
        given(paypalClient.getOrderStatus(ORDER_ID)).willReturn("COMPLETED");
        given(reservationService.lockAndConfirmForReconciliation(RESERVATION_ID))
                .willReturn(CaptureFinalizeResult.UNFULFILLABLE);

        reconciliationService.reconcileOne(PAYMENT_ID);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.REFUND_REQUIRED);
    }

    @Test
    @DisplayName("정산: PayPal 이 미완료(COMPLETED 아님)면 과금 안 된 것이므로 FAILED 로 종료한다.")
    void reconcile_notCompleted_marksFailed() {
        given(paymentRepository.findById(PAYMENT_ID)).willReturn(Optional.of(payment));
        given(paypalClient.getOrderStatus(ORDER_ID)).willReturn("APPROVED");

        reconciliationService.reconcileOne(PAYMENT_ID);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);
        verify(reservationService, never()).lockAndConfirmForReconciliation(anyLong());
    }

    @Test
    @DisplayName("정산: 이미 CAPTURING 이 아니면(다른 실행이 처리) 아무 것도 하지 않는다.")
    void reconcile_notCapturing_isNoOp() {
        ReflectionTestUtils.setField(payment, "status", PaymentStatus.CAPTURED);
        given(paymentRepository.findById(PAYMENT_ID)).willReturn(Optional.of(payment));

        reconciliationService.reconcileOne(PAYMENT_ID);

        verify(paypalClient, never()).getOrderStatus(any());
        verify(reservationService, never()).lockAndConfirmForReconciliation(anyLong());
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CAPTURED);
    }
}
