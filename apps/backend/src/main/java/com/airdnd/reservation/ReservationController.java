package com.airdnd.reservation;

import com.airdnd.reservation.dto.ReservationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;


    @PostMapping
    public ResponseEntity<Long> reservationRoom(@RequestBody ReservationRequest request) {
        Long reservationId = reservationService.createReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationId);
    }

}
