package com.airdnd.room;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> , RoomQueryRepository{

    @Query("SELECT r FROM Room r WHERE r.hostId = :hostId AND r.isDeleted = false")
    List<Room> findByHostId(Long hostId);

    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.isDeleted = false")
    List<Room> findAllByIsActive();


    @Lock(LockModeType.PESSIMISTIC_WRITE)
//    @QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value = "0")})
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT DISTINCT r FROM Room r LEFT JOIN FETCH r.images WHERE r.id IN :ids")
    List<Room> findAllWithImagesByIdIn(@Param("ids") List<Long> ids);

}
