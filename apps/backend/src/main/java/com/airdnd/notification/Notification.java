package com.airdnd.notification;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    @Column(nullable = false)
    private String content;

    @Column(length = 500)
    private String redirectUrl;

    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    private Notification(Long id, Long memberId, NotificationType type,
                         String content, String redirectUrl, boolean isRead, LocalDateTime createdAt) {

        this.id = id;
        this.memberId = memberId;
        this.type = type;
        this.content = content;
        this.redirectUrl = redirectUrl;
        this.isRead = isRead;
        this.createdAt = createdAt;

    }


    public static Notification create(Long memberId, NotificationType type, String content, String redirectUrl) {

        return Notification.builder()
                .memberId(memberId)
                .type(type)
                .content(content)
                .redirectUrl(redirectUrl)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public void markAsRead() {
        this.isRead = true;
    }

}

