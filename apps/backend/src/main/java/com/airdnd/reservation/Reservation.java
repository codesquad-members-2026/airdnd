package com.airdnd.reservation;


import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;


@Entity
@Table(name = "reservations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long guestId;

    @Column(nullable = false)
    private Long roomId;

    @Column(nullable = false)
    private LocalDate checkInDate;
    @Column(nullable = false)
    private LocalDate checkOutDate;

    @Column(nullable = false)
    private Integer totalPrice;

    @Column(nullable = false)
    private int adultCount;

    @Column(nullable = false)
    private  int childCount;

    @Column(nullable = false)
    private  int infantCount;

    private  boolean hasPets;

    private  String status;

    private LocalDateTime createdAt;
    private  LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    @Builder
    private Reservation (Long id, Long guestId, Long roomId, LocalDate checkInDate, LocalDate checkOutDate, Integer totalPrice,
                         int adultCount, int childCount, int infantCount,
                         boolean hasPets, String status, LocalDateTime createdAt,
                         LocalDateTime updatedAt, LocalDateTime deletedAt) {
        this.id = id;
        this.guestId = guestId;
        this.roomId = roomId;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.totalPrice = totalPrice;
        this.adultCount = adultCount;
        this.childCount = childCount;
        this.infantCount = infantCount;
        this.hasPets = hasPets;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }
}
