package com.airdnd.notification;

import com.airdnd.reservation.event.ReservationCancelledEvent;
import com.airdnd.reservation.event.ReservationConfirmedEvent;
import com.airdnd.review.event.ReviewCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onConfirmed(ReservationConfirmedEvent e) {
        notificationService.notify(e.hostId(), NotificationType.HOST,
                e.roomName() + " " + e.checkInDate() + " ~ " + e.checkOutDate()
                        + "\n새로운 예약이 들어왔습니다",
                "/host/rooms/" + e.roomId() + "/reservations");
        notificationService.notify(e.guestId(), NotificationType.RESERVATION,
                e.roomName() + " " + e.checkInDate() + " ~ " + e.checkOutDate()
                        + "\n예약이 확정되었습니다.",
                "/reservations/" + e.reservationId());
    }

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCancelled(ReservationCancelledEvent e) {
        notificationService.notify(e.hostId(), NotificationType.HOST,
                e.roomName() + " " + e.checkInDate() + " ~ " + e.checkOutDate()
                        + "\n예약이 취소되었습니다",
                "/host/rooms/"  + e.roomId() + "/reservations");
    }

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onReviewCreated(ReviewCreatedEvent e) {
        notificationService.notify(e.hostId(), NotificationType.REVIEW,
                e.roomName() + " · " + e.rating() + "점"
                        + "\n내 숙소에 새 후기가 등록되었습니다",
                "/rooms/" + e.roomId());
    }

}
