package codesquad.airdnd.domain.payment;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.payment.dto.request.PaymentConfirmRequest;
import codesquad.airdnd.domain.payment.dto.request.TossCancelRequest;
import codesquad.airdnd.domain.payment.dto.response.*;
import codesquad.airdnd.domain.payment.dto.request.TossConfirmRequest;
import codesquad.airdnd.domain.payment.entity.Payment;
import codesquad.airdnd.domain.reservation.ReservationRepository;
import codesquad.airdnd.domain.reservation.ReservationService;
import codesquad.airdnd.domain.reservation.dto.response.RefundResponse;
import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.global.config.TossProperties;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final TossProperties tossProperties;
    private final RestClient tossRestClient;
    private final ReservationService reservationService;

    @Transactional
    public PaymentPrepareResponse prepare(Long memberId, Long resId){
        // TODO: 리팩토링 필요 -> reservationService에 요청하거나 오케스트레이션 객체를 통해 검증
        Reservation reservation = reservationRepository.findForUpdate(resId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

        if(!reservation.isPending()){
            throw new BusinessException(ErrorCode.NOT_PENDING_RESERVATION);
        }

        Listing listing = reservation.getListing();

        Optional<Payment> existing = paymentRepository.findByReservationId(resId);
        if(existing.isPresent()){
            return toResponse(existing.get(), listing);
        }

        Payment payment = paymentRepository.save(
                Payment.ready(UUID.randomUUID().toString(),
                        reservation.getTotalPrice(),
                        reservation.getReservationId()));

        return toResponse(payment, listing);
    }
    private PaymentPrepareResponse toResponse(Payment payment, Listing listing){
        return PaymentPrepareResponse.of(
                payment.getOrderId(), listing.getName(),
                tossProperties.successUrl(), tossProperties.failUrl(), payment.getAmount());
    }

    @Transactional
    public PaymentConfirmResponse confirm(Long memberId, PaymentConfirmRequest request){
        Payment payment = paymentRepository.findByOrderId(request.orderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_PAYMENT));

        if(!payment.isReady()){
            throw new BusinessException(ErrorCode.NOT_READY_PAYMENT);
        }

        if(!payment.isEqualAmount(request.amount())){
            throw new BusinessException(ErrorCode.NOT_EQUAL_INFO_PAYMENT);
        }

        Reservation reservation = reservationRepository.findById(payment.getReservationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

        if(!reservation.isOwnedBy(memberId)){
            throw new BusinessException(ErrorCode.NOT_OWNER_PAYMENT);
        }

        TossConfirmRequest tossRequest =
                new TossConfirmRequest(request.paymentKey(), payment.getOrderId(), payment.getAmount().intValueExact());

        TossConfirmResponse tossResponse;
        try {
            tossResponse = tossRestClient.post()
                    .uri(tossProperties.confirmUri())
                    .header("Idempotency-Key", "confirm-" + payment.getOrderId())
                    .body(tossRequest)
                    .retrieve()
                    .body(TossConfirmResponse.class);
        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.CONFIRM_FAILED_PAYMENT);
        }

        if(tossResponse == null){
            throw new BusinessException(ErrorCode.CONFIRM_FAILED_PAYMENT);
        }

        payment.complete(
                tossResponse.paymentKey(),
                tossResponse.method(),
                OffsetDateTime.parse(tossResponse.approvedAt()).toLocalDateTime());

        reservation.confirm();

        return PaymentConfirmResponse.from(payment);
    }

    @Transactional
    public void expire(Long paymentId){
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_PAYMENT));

        if(!payment.isReady()){
            return;
        }

        payment.cancel();
        reservationService.releaseHold(payment.getReservationId());
    }

    @Transactional
    public RefundResponse refund(Reservation res, BigDecimal refundAmount, String cancelReason){
        Payment payment = paymentRepository.findByReservationId(res.getReservationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_PAYMENT));

        if(payment.isRefunded()){
            throw new BusinessException(ErrorCode.ALREADY_REFUNDED_PAYMENT);
        }

        if(!payment.isDone()){
            throw new BusinessException(ErrorCode.NOT_DONE_PAYMENT);
        }

        // 토스 취소 API 전송
        TossCancelRequest tossRequest = new TossCancelRequest(cancelReason, refundAmount.intValueExact());
        TossCancelResponse tossResponse;

        try {
            tossResponse = tossRestClient.post()
                    .uri(tossProperties.cancelUri(), payment.getPaymentKey())
                    .header("Idempotency-Key", "cancel-" + payment.getOrderId()) // TODO: 부분환불 시 키 전략 재검토
                    .body(tossRequest)
                    .retrieve()
                    .body(TossCancelResponse.class);

        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.REFUND_FAILED_PAYMENT);
        }

        if(tossResponse == null || tossResponse.cancels() == null || tossResponse.cancels().isEmpty()
                || tossResponse.cancelAmount() == null || tossResponse.canceledAt() == null){
            throw new BusinessException(ErrorCode.REFUND_FAILED_PAYMENT);
        }

        if(refundAmount.compareTo(BigDecimal.valueOf(tossResponse.cancelAmount())) != 0){
            throw new BusinessException(ErrorCode.NOT_EQUAL_REFUND_AMOUNT_PAYMENT);
        }

        payment.refund(tossResponse.cancelReason(), tossResponse.canceledAt().toLocalDateTime());

        return RefundResponse.of(payment, res, tossResponse);
    }
}
