package com.airdnd.review;


import com.airdnd.reservation.Reservation;
import com.airdnd.reservation.ReservationRepository;
import com.airdnd.review.dto.ReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReservationRepository reservationRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsRoomId(Long roomId) {
        List<Reservation> reservations = reservationRepository.findByRoomId(roomId);
        List<ReviewResponse> reviews = new ArrayList<>();
        for (Reservation reservation : reservations) {
            List<Review> reservationReviews = reviewRepository.findByReservationId(reservation.getId());
            for (Review review : reservationReviews) {
                reviews.add( new ReviewResponse(
                        review.getId(),
                        review.getRating(),
                        review.getComment(),
                        review.getCreatedAt(),
                        review.getUpdatedAt(),
                        review.getMember().getNickname()
                ));
            }
        }
        return reviews;
    }
}
