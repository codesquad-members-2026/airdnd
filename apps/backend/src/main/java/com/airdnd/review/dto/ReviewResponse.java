package com.airdnd.review.dto;

import com.airdnd.review.Review;

import java.time.LocalDateTime;

public record ReviewResponse(

        Long id,
        double rating,
        String comment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String authorName
) {

    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt(),
                review.getMember().getNickname()
        );
    }
}
