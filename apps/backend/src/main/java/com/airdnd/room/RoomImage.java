package com.airdnd.room;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_images")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RoomImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false, length = 500)
    private String imageUrl;

    @Column(nullable = false)
    private Boolean isRepresentative;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public RoomImage(String imageUrl, Boolean isRepresentative) {
        this.imageUrl = imageUrl;
        this.isRepresentative = isRepresentative;
        this.createdAt = LocalDateTime.now();
    }

    void assignRoom(Room room) {
        this.room = room;
    }
}
