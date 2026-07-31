package com.airdnd.notification;


import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final NotificationEmitterRegistry emitterRegistry;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long memberId) {
        return notificationRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .map(n -> new NotificationResponse(
                        n.getId(),n.getType(),n.getContent(),n.getRedirectUrl(),
                        n.isRead(),n.getCreatedAt())).toList();
    }

    @Transactional
    public void markRead(Long memberId, Long id) {
        Notification notification = notificationRepository.findByIdAndMemberId(id, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));
        notification.markAsRead();
    }

    @Transactional
    public void markAllRead(Long memberId) {
        notificationRepository.markAllAsReadByMemberId(memberId);
    }

    // 비동기 리스너(@Async, AFTER_COMMIT)에서 호출된다 — 이미 요청 트랜잭션 밖이다.
    // 단일 save 는 repository 호출 자체가 트랜잭션이라 별도 @Transactional 래퍼가 필요 없고,
    // SSE 전송은 트랜잭션 밖에서 수행해 느린 클라이언트가 DB 커넥션을 붙잡지 못하게 한다.
    // 알림 저장이 실패해도 호출 흐름을 막지 않도록 예외를 격리해 로깅한다.
    public void notify(Long memberId, NotificationType type, String content, String redirectUrl) {
        try {
            notificationRepository.save(Notification.create(memberId, type, content, redirectUrl));
        } catch (Exception e) {
            log.error("알림 저장 실패 memberId={}, type={}", memberId, type, e);
            return;
        }
        emitterRegistry.send(memberId, "new");
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long memberId) {
        return notificationRepository.countByMemberIdAndIsReadFalse(memberId);
    }
}
