package com.airdnd.reservation;

import com.airdnd.auth.AuthMemberPrincipal;
import com.airdnd.reservation.dto.BookedDateRange;
import com.airdnd.reservation.dto.GuestReservationCountsResponse;
import com.airdnd.reservation.dto.ReservationRequest;
import com.airdnd.reservation.dto.ReservationResponse;
import com.airdnd.room.dto.CursorPage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;


    @PostMapping
    public ResponseEntity<Long> reservationRoom(@AuthenticationPrincipal AuthMemberPrincipal principal, @Valid @RequestBody ReservationRequest request) {
        Long reservationId = reservationService.createReservation(principal.getMemberId(),request);
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationId);
    }

    @GetMapping("/rooms/{roomId}/booked-dates")
    public ResponseEntity<List<BookedDateRange>> bookedDates(@PathVariable Long roomId) {
        return ResponseEntity.ok(reservationService.getBookedRanges(roomId));
    }

    @GetMapping
    public ResponseEntity<CursorPage<ReservationResponse>> reservationRoomsList(
            @AuthenticationPrincipal AuthMemberPrincipal principal,
            @RequestParam(defaultValue = "UPCOMING") GuestReservationTab tab,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                reservationService.getGuestReservations(principal.getMemberId(), tab, cursor, size));
    }

    @GetMapping("/summary")
    public ResponseEntity<GuestReservationCountsResponse> reservationCounts(
            @AuthenticationPrincipal AuthMemberPrincipal principal) {
        return ResponseEntity.ok(reservationService.getGuestReservationCounts(principal.getMemberId()));
    }

    @GetMapping("{reservationId}")
    public ResponseEntity<ReservationResponse> getReservationDetail(@AuthenticationPrincipal AuthMemberPrincipal principal, @PathVariable Long reservationId){
        ReservationResponse response = reservationService.findReservationResponseById(principal.getMemberId(), reservationId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{reservationId}")
    public ResponseEntity<Void> cancelReservation(@PathVariable Long reservationId,
                                                  @AuthenticationPrincipal AuthMemberPrincipal principal) {
        reservationService.cancelReservation(reservationId, principal.getMemberId());
        return ResponseEntity.noContent().build();
    }

}
