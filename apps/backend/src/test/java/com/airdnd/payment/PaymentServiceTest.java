package com.airdnd.payment;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.config.PaypalProperties;
import com.airdnd.payment.dto.CaptureResponse;
import com.airdnd.payment.dto.PaymentOrderRequest;
import com.airdnd.reservation.Reservation;
import com.airdnd.reservation.ReservationService;
import com.airdnd.reservation.ReservationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PaypalClient paypalClient;
    @Mock
    private ReservationService reservationService;
    @Mock
    private PaymentCaptureMarker paymentCaptureMarker;
    @Mock
    private PaymentCaptureFinalizer paymentCaptureFinalizer;

    private PaymentService paymentService;

    private static final Long GUEST_ID = 7L;
    private static final Long OTHER_GUEST_ID = 99L;
    private static final Long RESERVATION_ID = 42L;
    private static final String ORDER_ID = "PP-ORDER-1";

    // KRW 1550 = 1 USD → 310,000원 = 200.00 USD
    private final PaypalProperties props =
            new PaypalProperties("client", "secret", "https://sandbox", "USD", new BigDecimal("1550"),
                    java.time.Duration.ofSeconds(5), java.time.Duration.ofSeconds(10));

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, paypalClient, props, reservationService, paymentCaptureMarker, paymentCaptureFinalizer);
    }

    private Reservation reservation(Long guestId, ReservationStatus status, long totalPrice) {
        Reservation r = Reservation.builder()
                .guestId(guestId)
                .roomId(1L)
                .totalPrice(totalPrice)
                .status(status)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        ReflectionTestUtils.setField(r, "id", RESERVATION_ID);
        return r;
    }

    private Payment payment(PaymentStatus status) {
        return Payment.builder()
                .paypalOrderId(ORDER_ID)
                .reservationId(RESERVATION_ID)
                .paypalAmount(new BigDecimal("200.00"))
                .currency("USD")
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ---------- createOrder ----------

    @Test
    @DisplayName("createOrder: 예약 금액(KRW)을 환율로 환산해 PayPal 주문을 만들고 reservationId 로 연결된 Payment(CREATED)를 저장한다.")
    void createOrder_success() {
        Reservation hold = reservation(GUEST_ID, ReservationStatus.PENDING, 310_000L);
        given(reservationService.getPayableHold(RESERVATION_ID, GUEST_ID)).willReturn(hold);
        given(paypalClient.createOrder(any())).willReturn(ORDER_ID);
        given(paymentRepository.save(any(Payment.class))).willAnswer(inv -> inv.getArgument(0));

        String orderId = paymentService.createOrder(new PaymentOrderRequest(RESERVATION_ID), GUEST_ID);

        assertThat(orderId).isEqualTo(ORDER_ID);

        ArgumentCaptor<BigDecimal> amount = ArgumentCaptor.forClass(BigDecimal.class);
        verify(paypalClient).createOrder(amount.capture());
        assertThat(amount.getValue()).isEqualByComparingTo("200.00"); // 310000 / 1550

        ArgumentCaptor<Payment> saved = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(saved.capture());
        assertThat(saved.getValue().getReservationId()).isEqualTo(RESERVATION_ID);
        assertThat(saved.getValue().getPaypalOrderId()).isEqualTo(ORDER_ID);
        assertThat(saved.getValue().getStatus()).isEqualTo(PaymentStatus.CREATED);
    }

    @Test
    @DisplayName("createOrder: 결제 불가 예약이면 PayPal 주문 생성도 Payment 저장도 하지 않는다.")
    void createOrder_rejectedWhenNotPayable() {
        given(reservationService.getPayableHold(RESERVATION_ID, GUEST_ID))
                .willThrow(new BusinessException(ErrorCode.RESERVATION_NOT_PAYABLE));

        assertThatThrownBy(() -> paymentService.createOrder(new PaymentOrderRequest(RESERVATION_ID), GUEST_ID))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.RESERVATION_NOT_PAYABLE);

        verify(paypalClient, never()).createOrder(any());
        verify(paymentRepository, never()).save(any());
    }

    // ---------- capture ----------

    @Test
    @DisplayName("capture: 본인 예약이면 1단계 재검증 → PayPal capture → 3단계 마감(finalizer) 순으로 수행하고 reservationId 를 돌려준다.")
    void capture_success() {
        Payment payment = payment(PaymentStatus.CREATED);
        Reservation reservation = reservation(GUEST_ID, ReservationStatus.PENDING, 310_000L);
        given(paymentRepository.findByPaypalOrderId(ORDER_ID)).willReturn(Optional.of(payment));
        given(reservationService.findReservationById(RESERVATION_ID)).willReturn(reservation);

        CaptureResponse response = paymentService.capture(ORDER_ID, GUEST_ID);

        assertThat(response.reservationId()).isEqualTo(RESERVATION_ID);
        verify(reservationService).lockAndPrepareForCapture(RESERVATION_ID);
        verify(paypalClient).captureOrder(ORDER_ID);
        verify(paymentCaptureFinalizer).finalizeCapture(payment.getId());
    }

    @Test
    @DisplayName("capture: 주문이 없으면 PAYMENT_NOT_FOUND 로 실패하고 PayPal 을 호출하지 않는다.")
    void capture_paymentNotFound() {
        given(paymentRepository.findByPaypalOrderId("MISSING")).willReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.capture("MISSING", GUEST_ID))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.PAYMENT_NOT_FOUND);

        verify(paypalClient, never()).captureOrder(any());
    }

    @Test
    @DisplayName("capture: 예약 소유자가 아니면 UNAUTHORIZED_ACTION 으로 막고 PayPal capture·확정을 하지 않는다.")
    void capture_rejectedWhenNotOwner() {
        Payment payment = payment(PaymentStatus.CREATED);
        Reservation othersReservation = reservation(OTHER_GUEST_ID, ReservationStatus.PENDING, 310_000L);
        given(paymentRepository.findByPaypalOrderId(ORDER_ID)).willReturn(Optional.of(payment));
        given(reservationService.findReservationById(RESERVATION_ID)).willReturn(othersReservation);

        assertThatThrownBy(() -> paymentService.capture(ORDER_ID, GUEST_ID))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.UNAUTHORIZED_ACTION);

        verify(paypalClient, never()).captureOrder(any());
        verify(paymentCaptureMarker, never()).markCapturing(any());
        verify(paymentCaptureFinalizer, never()).finalizeCapture(any());
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CREATED);
        assertThat(othersReservation.getStatus()).isEqualTo(ReservationStatus.PENDING);
    }

    @Test
    @DisplayName("capture: 이미 CAPTURED 면 PAYMENT_ALREADY_CAPTURED 로 막고 중복 capture 하지 않는다.")
    void capture_rejectedWhenAlreadyCaptured() {
        Payment payment = payment(PaymentStatus.CAPTURED);
        Reservation reservation = reservation(GUEST_ID, ReservationStatus.CONFIRMED, 310_000L);
        given(paymentRepository.findByPaypalOrderId(ORDER_ID)).willReturn(Optional.of(payment));
        given(reservationService.findReservationById(RESERVATION_ID)).willReturn(reservation);

        assertThatThrownBy(() -> paymentService.capture(ORDER_ID, GUEST_ID))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.PAYMENT_ALREADY_CAPTURED);

        verify(paypalClient, never()).captureOrder(any());
    }

    @Test
    @DisplayName("capture: 결제 직전 재검증에서 방이 이미 점유됐으면 PayPal capture·확정 없이 막아 과금을 막는다.")
    void capture_rejectedWhenRoomTakenByOthers() {
        Payment payment = payment(PaymentStatus.CREATED);
        Reservation reservation = reservation(GUEST_ID, ReservationStatus.PENDING, 310_000L);
        given(paymentRepository.findByPaypalOrderId(ORDER_ID)).willReturn(Optional.of(payment));
        given(reservationService.findReservationById(RESERVATION_ID)).willReturn(reservation);
        willThrow(new BusinessException(ErrorCode.ROOM_ALREADY_BOOKED))
                .given(reservationService).lockAndPrepareForCapture(RESERVATION_ID);

        assertThatThrownBy(() -> paymentService.capture(ORDER_ID, GUEST_ID))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.ROOM_ALREADY_BOOKED);

        verify(paypalClient, never()).captureOrder(any());
        verify(paymentCaptureMarker, never()).markCapturing(any());
        verify(paymentCaptureFinalizer, never()).finalizeCapture(any());
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CREATED);
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.PENDING);
    }

    @Test
    @DisplayName("capture: 재검증 → CAPTURING 내구 기록 → PayPal capture → 마감 순서로 수행된다(PayPal 은 락 밖).")
    void capture_validatesAndMarksCapturingBeforeCharging() {
        Payment payment = payment(PaymentStatus.CREATED);
        Reservation reservation = reservation(GUEST_ID, ReservationStatus.PENDING, 310_000L);
        given(paymentRepository.findByPaypalOrderId(ORDER_ID)).willReturn(Optional.of(payment));
        given(reservationService.findReservationById(RESERVATION_ID)).willReturn(reservation);

        paymentService.capture(ORDER_ID, GUEST_ID);

        var order = inOrder(reservationService, paymentCaptureMarker, paypalClient, paymentCaptureFinalizer);
        order.verify(reservationService).lockAndPrepareForCapture(RESERVATION_ID);
        order.verify(paymentCaptureMarker).markCapturing(payment.getId());
        order.verify(paypalClient).captureOrder(ORDER_ID);
        order.verify(paymentCaptureFinalizer).finalizeCapture(payment.getId());
    }
}
