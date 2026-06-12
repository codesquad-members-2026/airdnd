package com.airdnd.review;


import com.airdnd.room.Room;
import com.airdnd.user.Member;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @NotNull
    private Long reservationId;

    private double rating;

    private String comment;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
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
}
