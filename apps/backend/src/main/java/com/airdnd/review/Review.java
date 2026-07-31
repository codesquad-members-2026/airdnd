package com.airdnd.review;


import com.airdnd.review.dto.ReviewRequest;
import com.airdnd.room.Room;
import com.airdnd.user.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_reviews_reservation_id",
                columnNames = "reservation_id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long reservationId;

    @Column(nullable = false)
    private double rating;

    @Column(nullable = false, length = 1000)
    private String comment;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Builder
    public Review(Long id, Long reservationId, double rating,
                  String comment, LocalDateTime createdAt,
                  LocalDateTime updatedAt, LocalDateTime deletedAt, Room room, Member member) {
        this.id = id;
        this.reservationId = reservationId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
        this.member = member;
    }

    public static Review create(Long reservationId, Member member, ReviewRequest request) {
        LocalDateTime now = LocalDateTime.now();
        return Review.builder()
                .reservationId(reservationId)
                .member(member)
                .rating(request.rating())
                .comment(request.comment())
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
