package com.airdnd.reservation;

import com.airdnd.reservation.dto.BookedDateRange;
import com.airdnd.reservation.dto.ReservationStatusCount;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByRoomId(Long roomId);

    List<Reservation> findByGuestId(Long guestId);

    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
            FROM Reservation r
            WHERE r.roomId = :roomId
              AND r.status IN :statuses
              AND (r.status <> com.airdnd.reservation.ReservationStatus.PENDING OR r.expiresAt > :now)
              AND r.checkInDate < :newCheckOut
              AND r.checkOutDate > :newCheckIn
            """)
    boolean existsOverlappingReservation(@Param("roomId") Long roomId,
                                         @Param("statuses") Collection<ReservationStatus> statuses,
                                         @Param("now") LocalDateTime now,
                                         @Param("newCheckIn") LocalDate newCheckIn,
                                         @Param("newCheckOut") LocalDate newCheckOut);

    @Query("""
            SELECT new com.airdnd.reservation.dto.BookedDateRange(r.checkInDate, r.checkOutDate)
            FROM Reservation r
            WHERE r.roomId = :roomId
              AND r.status IN :statuses
              AND (r.status <> com.airdnd.reservation.ReservationStatus.PENDING OR r.expiresAt > :now)
              AND r.checkOutDate > :fromDate
            ORDER BY r.checkInDate ASC
            """)
    List<BookedDateRange> findBookedRanges(@Param("roomId") Long roomId,
                                           @Param("statuses") Collection<ReservationStatus> statuses,
                                           @Param("fromDate") LocalDate fromDate,
                                           @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true)
    @Query(""" 
            UPDATE Reservation r SET r.status = com.airdnd.reservation.ReservationStatus.CANCELLED,
            r.updatedAt = :now,
            r.deletedAt = :now
            WHERE r.status = com.airdnd.reservation.ReservationStatus.PENDING AND r.expiresAt < :now
            """)
    int bulkCancelExpiredReservations(@Param("now") LocalDateTime now);



    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
            FROM Reservation r
            WHERE r.roomId = :roomId
              AND r.id <> :currentId
              AND r.status IN :statuses
              AND (r.status <> com.airdnd.reservation.ReservationStatus.PENDING OR r.expiresAt > :now)
              AND r.checkInDate < :newCheckOut
              AND r.checkOutDate > :newCheckIn
            """)
    boolean existsOverlappingReservationExcludeCurrentId(@Param("roomId") Long roomId,
                                                         @Param("statuses") Collection<ReservationStatus> statuses,
                                                         @Param("now") LocalDateTime now,
                                                         @Param("newCheckIn") LocalDate newCheckIn,
                                                         @Param("newCheckOut") LocalDate newCheckOut,
                                                         @Param("currentId") Long currentId
    );

    @Query("""
            SELECT r FROM Reservation r
            WHERE r.roomId = :roomId
              AND (:status IS NULL OR r.status = :status)
              AND (:lastId IS NULL OR r.id < :lastId)
            ORDER BY r.id DESC
            """)
    List<Reservation> findHostRoomReservationPage(@Param("roomId") Long roomId,
                                                  @Param("status") ReservationStatus status,
                                                  @Param("lastId") Long lastId,
                                                  Pageable pageable);


    @Query("""
            SELECT new com.airdnd.reservation.dto.ReservationStatusCount(r.status, COUNT(r))
            FROM Reservation r
            WHERE r.roomId = :roomId
            GROUP BY r.status
            """)
    List<ReservationStatusCount> countByStatusForRoom(@Param("roomId") Long roomId);

    // ── 게스트 예약 목록 커서 페이지 (날짜 기반 탭, keyset 페이지네이션) ──────────────────
    // 동점(같은 날짜) 처리를 위해 id 를 2차 정렬 키로 함께 사용한다. lastDate 가 null 이면 첫 페이지.

    // 다가오는: 취소 아님 + 체크아웃이 오늘 이후, checkIn ASC, id ASC
    @Query("""
            SELECT r FROM Reservation r
            WHERE r.guestId = :guestId
              AND r.status <> com.airdnd.reservation.ReservationStatus.CANCELLED
              AND r.checkOutDate >= :today
              AND ( :lastCheckIn IS NULL
                    OR r.checkInDate > :lastCheckIn
                    OR (r.checkInDate = :lastCheckIn AND r.id > :lastId) )
            ORDER BY r.checkInDate ASC, r.id ASC
            """)
    List<Reservation> findGuestUpcomingPage(@Param("guestId") Long guestId,
                                            @Param("today") LocalDate today,
                                            @Param("lastCheckIn") LocalDate lastCheckIn,
                                            @Param("lastId") Long lastId,
                                            Pageable pageable);

    // 지난: 취소 아님 + 체크아웃이 오늘 이전, checkOut DESC, id DESC
    @Query("""
            SELECT r FROM Reservation r
            WHERE r.guestId = :guestId
              AND r.status <> com.airdnd.reservation.ReservationStatus.CANCELLED
              AND r.checkOutDate < :today
              AND ( :lastCheckOut IS NULL
                    OR r.checkOutDate < :lastCheckOut
                    OR (r.checkOutDate = :lastCheckOut AND r.id < :lastId) )
            ORDER BY r.checkOutDate DESC, r.id DESC
            """)
    List<Reservation> findGuestPastPage(@Param("guestId") Long guestId,
                                        @Param("today") LocalDate today,
                                        @Param("lastCheckOut") LocalDate lastCheckOut,
                                        @Param("lastId") Long lastId,
                                        Pageable pageable);

    // 취소: 상태 CANCELLED, checkOut DESC, id DESC
    @Query("""
            SELECT r FROM Reservation r
            WHERE r.guestId = :guestId
              AND r.status = com.airdnd.reservation.ReservationStatus.CANCELLED
              AND ( :lastCheckOut IS NULL
                    OR r.checkOutDate < :lastCheckOut
                    OR (r.checkOutDate = :lastCheckOut AND r.id < :lastId) )
            ORDER BY r.checkOutDate DESC, r.id DESC
            """)
    List<Reservation> findGuestCancelledPage(@Param("guestId") Long guestId,
                                             @Param("lastCheckOut") LocalDate lastCheckOut,
                                             @Param("lastId") Long lastId,
                                             Pageable pageable);

    @Query("""
            SELECT COUNT(r) FROM Reservation r
            WHERE r.guestId = :guestId
              AND r.status <> com.airdnd.reservation.ReservationStatus.CANCELLED
              AND r.checkOutDate >= :today
            """)
    long countGuestUpcoming(@Param("guestId") Long guestId, @Param("today") LocalDate today);

    @Query("""
            SELECT COUNT(r) FROM Reservation r
            WHERE r.guestId = :guestId
              AND r.status <> com.airdnd.reservation.ReservationStatus.CANCELLED
              AND r.checkOutDate < :today
            """)
    long countGuestPast(@Param("guestId") Long guestId, @Param("today") LocalDate today);

    long countByGuestIdAndStatus(Long guestId, ReservationStatus status);
}
