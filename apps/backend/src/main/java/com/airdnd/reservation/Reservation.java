package com.airdnd.reservation;


import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.reservation.dto.ReservationRequest;
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
    private Long totalPrice;

    @Column(nullable = false)
    private int adultCount;

    @Column(nullable = false)
    private int childCount;

    @Column(nullable = false)
    private int infantCount;

    private boolean hasPets;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservationStatus status;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    @Builder
    private Reservation(Long id, Long guestId, Long roomId, LocalDate checkInDate, LocalDate checkOutDate, Long totalPrice,
                        int adultCount, int childCount, int infantCount,
                        boolean hasPets, ReservationStatus status, LocalDateTime expiresAt, LocalDateTime createdAt,
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
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }

    public void cancel() {
        this.status = ReservationStatus.CANCELLED;
        this.deletedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void confirm() {
        if(this.status == ReservationStatus.CANCELLED){
            throw new BusinessException(ErrorCode.RESERVATION_LOCK_TIMEOUT, "이미 취소된 예약입니다 다시 확인해주세요");
        }
        else if(this.status == ReservationStatus.CONFIRMED){
            throw new BusinessException(ErrorCode.RESERVATION_NOT_PAYABLE, "이미 확정된 예약입니다");
        }
        else{
            this.status = ReservationStatus.CONFIRMED;
            this.expiresAt = null;
            this.updatedAt = LocalDateTime.now();
        }
    }

    public static Reservation createHold(Long memberId, ReservationRequest request, long totalPrice, LocalDateTime expiresAt) {
        return Reservation.builder()
                .guestId(memberId)
                .roomId(request.roomId())
                .checkInDate(request.checkInDate())
                .checkOutDate(request.checkOutDate())
                .totalPrice(totalPrice)
                .adultCount(request.adultCount())
                .childCount(request.childCount())
                .infantCount(request.infantCount())
                .hasPets(request.hasPets())
                .status(ReservationStatus.PENDING)
                .expiresAt(expiresAt)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public void reacquireHold(LocalDateTime newExpirationTime){
        this.status = ReservationStatus.PENDING;
        this.expiresAt = newExpirationTime;
        this.deletedAt = null;
        this.updatedAt = LocalDateTime.now();
    }
}
