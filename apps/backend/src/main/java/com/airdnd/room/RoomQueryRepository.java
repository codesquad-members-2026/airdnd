package com.airdnd.room;

import com.airdnd.room.dto.RoomRatingDto;
import com.airdnd.room.dto.RoomSearchRequestDto;
import com.airdnd.room.dto.RoomSummary;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface RoomQueryRepository{

    List<RoomSummary> findPage(RoomSearchRequestDto conditions, LocalDateTime now);

    long countInArea(RoomSearchRequestDto conditions, LocalDateTime now);

    RoomRatingDto findRatingByRoomId(Long roomId);

    Map<Long, RoomRatingDto> findRatingByRoomIds(List<Long> roomIds);
}
