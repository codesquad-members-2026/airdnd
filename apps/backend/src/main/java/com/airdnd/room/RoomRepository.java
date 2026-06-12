package com.airdnd.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    @Query("SELECT r FROM Room r WHERE r.hostId = :hostId AND r.isDeleted = false")
    List<Room> findByHostId(Long hostId);

    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.isDeleted = false")
    List<Room> findAllByIsActive();

}
