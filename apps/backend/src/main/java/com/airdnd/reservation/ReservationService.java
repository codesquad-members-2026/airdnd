package com.airdnd.reservation;

import com.airdnd.reservation.dto.ReservationRequest;
import com.airdnd.room.Room;
import com.airdnd.room.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;

    @Transactional
    public Long createReservation(ReservationRequest request) {

        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new IllegalArgumentException("Room Not Found"));

        int totalGuests = request.adultCount() + request.childCount();

        if(totalGuests > room.getMaxCapacity()) {
            throw new IllegalArgumentException("Room Capacity Exceeded");
        }
        Reservation reservation = Reservation.builder()
                .guestId(request.guestId())
                .roomId(request.roomId())
                .checkInDate(request.checkInDate())
                .checkOutDate(request.checkOutDate())
                .totalPrice(request.totalPrice())
                .adultCount(request.adultCount())
                .childCount(request.childCount())
                .infantCount(request.infantCount())
                .hasPets(request.hasPets())
                .status("CONFIRMED")
                .createdAt(LocalDateTime.now())
                .build();

        Reservation savedReservation = reservationRepository.save(reservation);
        return savedReservation.getId();
    }
}
