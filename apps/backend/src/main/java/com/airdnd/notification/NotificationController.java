package com.airdnd.notification;

import com.airdnd.auth.AuthMemberPrincipal;
import com.airdnd.notification.dto.NotificationResponse;
import com.airdnd.notification.dto.UnreadCountResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")

public class NotificationController {
    private final NotificationService service;
    private final NotificationEmitterRegistry emitterRegistry;
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(@AuthenticationPrincipal
                                                                           AuthMemberPrincipal principal) {
        return ResponseEntity.ok(service.getNotifications(principal.getMemberId()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@AuthenticationPrincipal AuthMemberPrincipal principal, @PathVariable Long id) {
        service.markRead(principal.getMemberId(), id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markReadAll(@AuthenticationPrincipal AuthMemberPrincipal principal) {
        service.markAllRead(principal.getMemberId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @AuthenticationPrincipal AuthMemberPrincipal principal) {
        return ResponseEntity.ok(new UnreadCountResponse(service.getUnreadCount(principal.getMemberId())));
    }

    @GetMapping("/stream")
    public SseEmitter getStream(@AuthenticationPrincipal AuthMemberPrincipal principal) {
        return emitterRegistry.subscribe(principal.getMemberId());
    }

}


