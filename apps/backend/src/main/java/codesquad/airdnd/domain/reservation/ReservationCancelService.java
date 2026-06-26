package codesquad.airdnd.domain.reservation;

import codesquad.airdnd.domain.payment.PaymentService;
import codesquad.airdnd.domain.reservation.dto.request.ReservationCancelRequest;
import codesquad.airdnd.domain.reservation.dto.response.RefundResponse;
import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.global.auth.CurrentMemberInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReservationCancelService {

    private final ReservationService reservationService;
    private final PaymentService paymentService;

    @Transactional
    public RefundResponse cancel(CurrentMemberInfo guest, Long resId, ReservationCancelRequest request) {
        // 예약 검증, 선점 해제, 상태변경 후 엔티티 반환
        Reservation reservation = reservationService.cancelReservation(guest.id(), resId);

        // 결제 검증, 토스 서버 POST 요청 전송, 결제 상태 변경
        return paymentService.refund(reservation, reservation.getTotalPrice(), request.cancelReason());
    }
}
