package com.airdnd.review.dto;

import java.time.LocalDateTime;

public record ReviewResponse(

        Long id,
        double rating,
        String comment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String authorName
) { }
