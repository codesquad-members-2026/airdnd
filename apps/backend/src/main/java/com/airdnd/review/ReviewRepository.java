package com.airdnd.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository <Review, Long> {

    boolean existsByReservationId(Long reservationId);

    @Query("select r.reservationId from Review r where r.reservationId in :ids")
    List<Long> findReservationIdsByReservationIdIn(List<Long> ids);

    @Query("""
        SELECT r FROM Review r
        JOIN FETCH r.member
        WHERE r.reservationId IN (
            SELECT res.id FROM Reservation res WHERE res.roomId = :roomId
        )
        AND r.deletedAt IS NULL
        ORDER BY r.createdAt DESC
        """)
    List<Review> findWithMemberByRoomId(@Param("roomId") Long roomId);

}

