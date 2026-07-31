package com.airdnd.review;

import com.airdnd.auth.AuthMemberPrincipal;
import com.airdnd.review.dto.ReviewRequest;
import com.airdnd.review.dto.ReviewResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor

public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/api/rooms/{roomId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable Long roomId) {
        List<ReviewResponse> reviews = reviewService.getReviewsRoomId(roomId);
        return ResponseEntity.status(HttpStatus.OK).body(reviews);
    }

    @PostMapping("/api/reservations/{reservationId}/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long reservationId,
            @AuthenticationPrincipal AuthMemberPrincipal principal,
            @Valid @RequestBody ReviewRequest request) {
        ReviewResponse review = reviewService.createReview(reservationId, principal.getMemberId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }
}
