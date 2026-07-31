package com.airdnd.review;


import com.airdnd.auth.AuthMemberPrincipal;
import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.reservation.Reservation;
import com.airdnd.reservation.ReservationRepository;
import com.airdnd.reservation.ReservationStatus;
import com.airdnd.review.dto.ReviewRequest;
import com.airdnd.review.dto.ReviewResponse;
import com.airdnd.review.event.ReviewCreatedEvent;
import com.airdnd.room.Room;
import com.airdnd.room.RoomRepository;
import com.airdnd.user.Member;
import com.airdnd.user.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReservationRepository reservationRepository;
    private final MemberRepository memberRepository;
    private final RoomRepository roomRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsRoomId(Long roomId) {
        return reviewRepository.findWithMemberByRoomId(roomId).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    @Transactional
    public ReviewResponse createReview(Long reservationId, Long memberId, ReviewRequest request) {

        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

        if(!memberId.equals(reservation.getGuestId())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
        }

        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_ELIGIBLE);
        }
        if (!reservation.getCheckOutDate().isBefore(LocalDate.now())) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_ELIGIBLE);
        }

        if (reviewRepository.existsByReservationId(reservationId)) {
            throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        Member member = memberRepository.getReferenceById(memberId);
        Review review = reviewRepository.save(Review.create(reservationId, member, request));

        Room room = roomRepository.findById(reservation.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        applicationEventPublisher.publishEvent(new ReviewCreatedEvent(
                room.getId(), room.getHostId(), room.getName(),request.rating()
        ));
        return ReviewResponse.from(review);
    }
}
