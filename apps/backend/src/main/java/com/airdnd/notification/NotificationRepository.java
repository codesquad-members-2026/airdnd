package com.airdnd.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByMemberIdOrderByCreatedAtDesc(long memberId);

    Optional<Notification> findByIdAndMemberId(long id, long memberId);

    @Modifying
    @Query("update Notification n set n.isRead = true " +
            "where n.memberId = :memberId and n.isRead = false")
    void markAllAsReadByMemberId(@Param("memberId") Long memberId);

    long countByMemberIdAndIsReadFalse(long memberId);
}
