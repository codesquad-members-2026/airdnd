package com.airdnd.room;

import com.airdnd.room.dto.RoomDetailResponse;
import com.airdnd.room.dto.RoomResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getRooms() {
        List<RoomResponse> rooms = roomService.getRooms();
        return ResponseEntity.status(HttpStatus.OK).body(rooms);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomDetailResponse> getRoom(@PathVariable("roomId") Long roomId) {
        RoomDetailResponse room = roomService.getRoomById(roomId);
        return ResponseEntity.status(HttpStatus.OK).body(room);
    }

}
