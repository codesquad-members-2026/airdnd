package com.airdnd.review;

import com.airdnd.review.dto.ReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/{roomId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable Long roomId) {
        List<ReviewResponse> reviews = reviewService.getReviewsRoomId(roomId);
        return ResponseEntity.status(HttpStatus.OK).body(reviews);
    }
}
