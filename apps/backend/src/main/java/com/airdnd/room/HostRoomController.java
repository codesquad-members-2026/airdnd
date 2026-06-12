package com.airdnd.room;


import com.airdnd.auth.AuthMemberPrincipal;
import com.airdnd.room.dto.HostRoomRequest;
import com.airdnd.room.dto.HostRoomResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/host/rooms")
public class HostRoomController {

    private final RoomService roomService;


    @PostMapping
    public ResponseEntity<Long> registerRoom(@AuthenticationPrincipal AuthMemberPrincipal principal, @RequestBody @Valid HostRoomRequest request) {

        Long roomId = roomService.registerRoom(principal.getMemberId() , request);

        return ResponseEntity.status(HttpStatus.CREATED).body(roomId);
    }


    @GetMapping
    public ResponseEntity<List<HostRoomResponse>> getAllRooms(@AuthenticationPrincipal AuthMemberPrincipal principal) {

        return ResponseEntity.status(HttpStatus.OK).body(roomService.getRoomsByHostId(principal.getMemberId()));

    }
}
