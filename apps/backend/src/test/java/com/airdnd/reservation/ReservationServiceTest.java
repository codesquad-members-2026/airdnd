package com.airdnd.reservation;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.reservation.dto.ReservationRequest;
import com.airdnd.room.Room;
import com.airdnd.room.RoomRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @InjectMocks
    private ReservationService reservationService;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private RoomRepository roomRepository;

    private static final Long MEMBER_ID = 9002L;
    private static final Long OTHER_MEMBER_ID = 5005L;
    private static final Long ROOM_ID = 1L;
    private static final Long HOLD_ID = 55L;

    private ReservationRequest request(LocalDate checkIn, LocalDate checkOut) {
        return new ReservationRequest(
                ROOM_ID, checkIn, checkOut,
                2, 0, 0, false);
    }

    private Room roomWithCapacity(int capacity) {
        Room room = Room.builder().maxCapacity(capacity).pricePerNight(100000).build();
        ReflectionTestUtils.setField(room, "id", ROOM_ID);
        return room;
    }

    private Reservation hold(Long guestId, ReservationStatus status, LocalDateTime expiresAt) {
        Reservation r = Reservation.builder()
                .guestId(guestId).roomId(ROOM_ID).status(status).expiresAt(expiresAt).totalPrice(100_000L)
                .build();
        ReflectionTestUtils.setField(r, "id", HOLD_ID);
        return r;
    }

    @Test
    @DisplayName("겹치는 예약이 없으면 잠금을 잡고 예약이 저장된다.")
    void createReservation_success_whenNoOverlap() {
        // given
        ReservationRequest request = request(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3));
        given(roomRepository.findByIdForUpdate(ROOM_ID)).willReturn(Optional.of(roomWithCapacity(4)));
        given(reservationRepository.existsOverlappingReservation(eq(ROOM_ID), anyCollection(), any(), any(), any()))
                .willReturn(false);

        Reservation saved = Reservation.createHold(MEMBER_ID, request, 0L, null);
        ReflectionTestUtils.setField(saved, "id", 100L);
        given(reservationRepository.save(any(Reservation.class))).willReturn(saved);

        // when
        Long id = reservationService.createReservation(MEMBER_ID, request);

        // then
        assertThat(id).isEqualTo(100L);
        verify(roomRepository).findByIdForUpdate(ROOM_ID); // 잠금 경로로 조회했는지 확인
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    @DisplayName("겹치는 예약이 있으면 ROOM_ALREADY_BOOKED 로 거절되고 저장하지 않는다.")
    void createReservation_rejected_whenOverlap() {
        // given
        ReservationRequest request = request(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3));
        given(roomRepository.findByIdForUpdate(ROOM_ID)).willReturn(Optional.of(roomWithCapacity(4)));
        given(reservationRepository.existsOverlappingReservation(eq(ROOM_ID), anyCollection(), any(), any(), any()))
                .willReturn(true);

        // when & then
        assertThatThrownBy(() -> reservationService.createReservation(MEMBER_ID, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.ROOM_ALREADY_BOOKED);

        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("체크인이 체크아웃보다 늦거나 같으면 INVALID_RESERVATION_DATE 로 거절된다.")
    void createReservation_rejected_whenInvalidDate() {
        // given : checkIn == checkOut (0박)
        ReservationRequest request = request(LocalDate.of(2026, 7, 3), LocalDate.of(2026, 7, 3));
        given(roomRepository.findByIdForUpdate(ROOM_ID)).willReturn(Optional.of(roomWithCapacity(4)));

        // when & then
        assertThatThrownBy(() -> reservationService.createReservation(MEMBER_ID, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.INVALID_RESERVATION_DATE);

        verify(reservationRepository, never()).existsOverlappingReservation(any(), anyCollection(), any(), any(), any());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("인원이 숙소 최대 수용 인원을 넘으면 ROOM_CAPACITY_EXCEEDED 로 거절된다.")
    void createReservation_rejected_whenCapacityExceeded() {
        ReservationRequest request = request(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3)); // 성인 2명
        given(roomRepository.findByIdForUpdate(ROOM_ID)).willReturn(Optional.of(roomWithCapacity(1)));

        assertThatThrownBy(() -> reservationService.createReservation(MEMBER_ID, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.ROOM_CAPACITY_EXCEEDED);

        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("총액은 서버가 (1박 요금 × 박수)로 계산하고 만료 시각이 있는 PENDING 홀드로 저장한다.")
    void createReservation_computesPriceAndHoldServerSide() {
        ReservationRequest request = request(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3)); // 2박, 1박 100,000원
        given(roomRepository.findByIdForUpdate(ROOM_ID)).willReturn(Optional.of(roomWithCapacity(4)));
        given(reservationRepository.existsOverlappingReservation(eq(ROOM_ID), anyCollection(), any(), any(), any()))
                .willReturn(false);
        Reservation saved = Reservation.createHold(MEMBER_ID, request, 0L, null);
        ReflectionTestUtils.setField(saved, "id", 100L);
        given(reservationRepository.save(any(Reservation.class))).willReturn(saved);

        reservationService.createReservation(MEMBER_ID, request);

        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        Reservation toSave = captor.getValue();
        assertThat(toSave.getTotalPrice()).isEqualTo(200_000L);
        assertThat(toSave.getStatus()).isEqualTo(ReservationStatus.PENDING);
        assertThat(toSave.getGuestId()).isEqualTo(MEMBER_ID);
        assertThat(toSave.getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("getPayableHold: 본인 소유의 만료 전 PENDING 홀드면 그대로 반환한다.")
    void getPayableHold_success() {
        Reservation reservation = hold(MEMBER_ID, ReservationStatus.PENDING, LocalDateTime.now().plusMinutes(10));
        given(reservationRepository.findById(HOLD_ID)).willReturn(Optional.of(reservation));

        assertThat(reservationService.getPayableHold(HOLD_ID, MEMBER_ID)).isSameAs(reservation);
    }

    @Test
    @DisplayName("getPayableHold: 예약이 없으면 RESERVATION_NOT_FOUND.")
    void getPayableHold_notFound() {
        given(reservationRepository.findById(HOLD_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.getPayableHold(HOLD_ID, MEMBER_ID))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.RESERVATION_NOT_FOUND);
    }

    @Test
    @DisplayName("getPayableHold: 소유자가 아니면 UNAUTHORIZED_ACTION.")
    void getPayableHold_rejectedWhenNotOwner() {
        Reservation reservation = hold(OTHER_MEMBER_ID, ReservationStatus.PENDING, LocalDateTime.now().plusMinutes(10));
        given(reservationRepository.findById(HOLD_ID)).willReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.getPayableHold(HOLD_ID, MEMBER_ID))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.UNAUTHORIZED_ACTION);
    }

    @Test
    @DisplayName("getPayableHold: 만료된 PENDING 이면 RESERVATION_NOT_PAYABLE.")
    void getPayableHold_rejectedWhenExpired() {
        Reservation reservation = hold(MEMBER_ID, ReservationStatus.PENDING, LocalDateTime.now().minusMinutes(1));
        given(reservationRepository.findById(HOLD_ID)).willReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.getPayableHold(HOLD_ID, MEMBER_ID))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.RESERVATION_NOT_PAYABLE);
    }

    @Test
    @DisplayName("getPayableHold: PENDING 이 아니면(이미 확정/취소) RESERVATION_NOT_PAYABLE.")
    void getPayableHold_rejectedWhenNotPending() {
        Reservation reservation = hold(MEMBER_ID, ReservationStatus.CONFIRMED, null);
        given(reservationRepository.findById(HOLD_ID)).willReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.getPayableHold(HOLD_ID, MEMBER_ID))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.RESERVATION_NOT_PAYABLE);
    }
}
