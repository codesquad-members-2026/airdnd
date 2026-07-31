package com.airdnd.notification.dto;
import com.airdnd.notification.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse (

        Long id,
        NotificationType type,
        String content,
        String redirectUrl,
        boolean read,
        LocalDateTime createdAt
)
{ }
