package com.airdnd.reservation;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.reservation.dto.BookedDateRange;
import com.airdnd.reservation.dto.GuestReservationCountsResponse;
import com.airdnd.reservation.dto.ReservationCountsResponse;
import com.airdnd.reservation.dto.ReservationRequest;
import com.airdnd.reservation.dto.ReservationResponse;
import com.airdnd.reservation.dto.ReservationStatusCount;
import com.airdnd.reservation.event.ReservationCancelledEvent;
import com.airdnd.review.ReviewRepository;
import com.airdnd.room.Cursors;
import com.airdnd.room.Room;
import com.airdnd.room.RoomRepository;
import com.airdnd.room.dto.CursorPage;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class ReservationService {

    private static final List<ReservationStatus> BLOCKING_STATUSES =
            List.of(ReservationStatus.CONFIRMED, ReservationStatus.PENDING);

    private static final int MAX_PAGE_SIZE = 100;
    private static final int HOLD_MINUTES = 15;

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final ReviewRepository reviewRepository;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final EntityManager entityManager;

    @Transactional
    public Long createReservation(Long memberId ,ReservationRequest request) {

        Room room = roomRepository.findByIdForUpdate(request.roomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if(!request.checkInDate().isBefore(request.checkOutDate())){
            throw new BusinessException(ErrorCode.INVALID_RESERVATION_DATE);
        }

        if (request.checkInDate().isBefore(LocalDate.now())) {
            throw new BusinessException(ErrorCode.INVALID_RESERVATION_DATE);
        }

        int totalGuests = request.adultCount() + request.childCount();

        if(totalGuests > room.getMaxCapacity()) {
            throw new BusinessException(ErrorCode.ROOM_CAPACITY_EXCEEDED);
        }

        LocalDateTime now = LocalDateTime.now();

        boolean alreadyBooked = reservationRepository.existsOverlappingReservation(
                request.roomId(), BLOCKING_STATUSES, now, request.checkInDate(), request.checkOutDate());
        if(alreadyBooked){
            throw new BusinessException(ErrorCode.ROOM_ALREADY_BOOKED);
        }

        if (request.hasPets() && !Boolean.TRUE.equals(room.getAllowsPets())) {
            throw new BusinessException(ErrorCode.PETS_NOT_ALLOWED);
        }
        if (request.infantCount() > 0 && !Boolean.TRUE.equals(room.getAllowsInfants())) {
            throw new BusinessException(ErrorCode.INFANTS_NOT_ALLOWED);
        }

        long nights = ChronoUnit.DAYS.between(request.checkInDate(), request.checkOutDate());
        long totalPrice = (long) room.getPricePerNight() * nights;
        LocalDateTime expiresAt = now.plusMinutes(HOLD_MINUTES);

        Reservation reservation = Reservation.createHold(memberId, request, totalPrice, expiresAt);

        Reservation savedReservation = reservationRepository.save(reservation);
        return savedReservation.getId();
    }

    @Transactional(readOnly = true)
    public List<BookedDateRange> getBookedRanges(Long roomId) {
        return reservationRepository.findBookedRanges(roomId, BLOCKING_STATUSES, LocalDate.now(), LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public CursorPage<ReservationResponse> getGuestReservations(
            Long guestId, GuestReservationTab tab, String cursor, int size) {

        int pageSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        LocalDate today = LocalDate.now();
        ReservationCursors.DateIdCursor last = ReservationCursors.decode(cursor);
        LocalDate lastDate = last == null ? null : last.date();
        Long lastId = last == null ? null : last.id();
        Pageable limit = PageRequest.of(0, pageSize + 1);

        // 다음 페이지 존재 여부 판단을 위해 size + 1 개까지 조회한다.
        List<Reservation> fetched = switch (tab) {
            case UPCOMING -> reservationRepository.findGuestUpcomingPage(guestId, today, lastDate, lastId, limit);
            case PAST -> reservationRepository.findGuestPastPage(guestId, today, lastDate, lastId, limit);
            case CANCELLED -> reservationRepository.findGuestCancelledPage(guestId, lastDate, lastId, limit);
        };

        boolean hasNext = fetched.size() > pageSize;
        List<Reservation> pageItems = hasNext ? fetched.subList(0, pageSize) : fetched;

        List<ReservationResponse> items = toResponses(pageItems);

        String nextCursor = null;
        if (hasNext) {
            Reservation lastItem = pageItems.get(pageItems.size() - 1);
            // 다가오는 탭은 checkIn, 지난/취소 탭은 checkOut 으로 정렬하므로 커서 날짜도 그에 맞춘다.
            LocalDate cursorDate = tab == GuestReservationTab.UPCOMING
                    ? lastItem.getCheckInDate()
                    : lastItem.getCheckOutDate();
            nextCursor = ReservationCursors.encode(cursorDate, lastItem.getId());
        }
        // 카운트는 별도 summary 엔드포인트에서 내려주므로 totalCount 는 사용하지 않는다.
        return new CursorPage<>(items, nextCursor, hasNext, null);
    }

    @Transactional(readOnly = true)
    public GuestReservationCountsResponse getGuestReservationCounts(Long guestId) {
        LocalDate today = LocalDate.now();
        long upcoming = reservationRepository.countGuestUpcoming(guestId, today);
        long past = reservationRepository.countGuestPast(guestId, today);
        long cancelled = reservationRepository.countByGuestIdAndStatus(guestId, ReservationStatus.CANCELLED);
        return new GuestReservationCountsResponse(upcoming, past, cancelled);
    }

    // 예약 엔티티 묶음을 응답으로 변환한다. 리뷰 작성 여부·룸 정보를 배치 조회해 N+1 을 피한다.
    private List<ReservationResponse> toResponses(List<Reservation> reservations) {
        if (reservations.isEmpty()) {
            return List.of();
        }
        List<Long> reservationIds = reservations.stream().map(Reservation::getId).toList();
        Set<Long> reviewedIds = new HashSet<>(reviewRepository.findReservationIdsByReservationIdIn(reservationIds));

        List<Long> roomIds = reservations.stream().map(Reservation::getRoomId).distinct().toList();
        Map<Long, Room> roomMap = roomRepository.findAllWithImagesByIdIn(roomIds).stream()
                .collect(Collectors.toMap(Room::getId, room -> room));

        List<ReservationResponse> responses = new ArrayList<>();
        for (Reservation reservation : reservations) {
            Room room = roomMap.get(reservation.getRoomId());
            if (room == null) {
                throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
            }
            responses.add(new ReservationResponse(
                    reservation.getId(),
                    room.getId(),
                    room.getName(),
                    room.getRepresentativeImageUrl(),
                    room.getRegion(),
                    reservation.getCheckInDate(),
                    reservation.getCheckOutDate(),
                    reservation.getAdultCount() + reservation.getChildCount(),
                    room.getPricePerNight(),
                    reservation.getTotalPrice(),
                    reservation.getStatus(),
                    reservation.getExpiresAt(),
                    reservation.getCreatedAt(),
                    reviewedIds.contains(reservation.getId())
            ));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public CursorPage<ReservationResponse> getHostRoomReservations(
            Long hostId, Long roomId, ReservationStatus status, String cursor, int size) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        if (!room.getHostId().equals(hostId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION, "본인 숙소의 예약만 확인 가능합니다.");
        }

        int pageSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        Long lastId = Cursors.decode(cursor);

        // 다음 페이지 존재 여부 판단을 위해 size + 1 개까지 조회한다.
        List<Reservation> fetched = reservationRepository.findHostRoomReservationPage(
                roomId, status, lastId, PageRequest.of(0, pageSize + 1));
        boolean hasNext = fetched.size() > pageSize;
        List<Reservation> pageItems = hasNext ? fetched.subList(0, pageSize) : fetched;

        List<ReservationResponse> items = pageItems.stream()
                .map(r -> new ReservationResponse(
                        r.getId(), room.getId(), room.getName(),
                        room.getRepresentativeImageUrl(), room.getRegion(),
                        r.getCheckInDate(), r.getCheckOutDate(),
                        r.getAdultCount() + r.getChildCount(),
                        room.getPricePerNight(), r.getTotalPrice(),
                        r.getStatus(), r.getExpiresAt(), r.getCreatedAt(),
                        false))
                .toList();

        String nextCursor = hasNext ? Cursors.encode(pageItems.get(pageItems.size() - 1).getId()) : null;
        // 카운트는 별도 summary 엔드포인트에서 내려주므로 totalCount 는 사용하지 않는다.
        return new CursorPage<>(items, nextCursor, hasNext, null);
    }

    @Transactional(readOnly = true)
    public ReservationCountsResponse getHostRoomReservationCounts(Long hostId, Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        if (!room.getHostId().equals(hostId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION, "본인 숙소의 예약만 확인 가능합니다.");
        }

        Map<ReservationStatus, Long> byStatus = reservationRepository.countByStatusForRoom(roomId).stream()
                .collect(Collectors.toMap(ReservationStatusCount::status, ReservationStatusCount::count));

        long confirmed = byStatus.getOrDefault(ReservationStatus.CONFIRMED, 0L);
        long pending = byStatus.getOrDefault(ReservationStatus.PENDING, 0L);
        long cancelled = byStatus.getOrDefault(ReservationStatus.CANCELLED, 0L);
        return new ReservationCountsResponse(confirmed + pending + cancelled, confirmed, pending, cancelled);
    }

    /**
     * 결제 capture 직전, 방 홀드를 다시 검증한다
     * 방 행을 비관적 락으로 잡아 createReservation·다른 capture 와 직렬화하고, 최신 상태를 다시 읽는다.
     * - 다른 예약이 같은 날짜를 잡고있는 중이면 결제 전에 ROOM_ALREADY_BOOKED 로 막는다(과금 방지).
     * - 자신의 홀드가 만료/취소됐더라도 방이 비어 있으면 홀드를 재획득해 결제를 이어간다.
     * 호출자(@Transactional)의 트랜잭션에 합류하므로 락은 결제 확정 커밋까지 유지된다.
     */
    /**
     * 결제 capture 1단계: 자기 트랜잭션 안에서 예약을 읽어 Room 락으로 점유를 재검증/홀드 재획득한다.
     * 이 메서드가 커밋되면 Room 락이 즉시 풀리므로, 호출자는 락을 쥐지 않은 채 PayPal 을 호출할 수 있다.
     */
    @Transactional
    public void lockAndPrepareForCapture(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));
        lockAndPrepareForCapture(reservation);
    }

    @Transactional
    public void lockAndPrepareForCapture(Reservation reservation) {
        switch (prepareForCaptureUnderLock(reservation)) {
            case ALREADY_CONFIRMED ->
                    throw new BusinessException(ErrorCode.RESERVATION_NOT_PAYABLE, "이미 확정된 예약입니다");
            case CONFLICT -> throw new BusinessException(ErrorCode.ROOM_ALREADY_BOOKED);
            case READY -> {}
        }
    }

//      복구용! CAPTURING 으로 멈춘 결제를 PayPal 이 COMPLETED 로 확인했을 때,

    @Transactional
    public CaptureFinalizeResult lockAndConfirmForReconciliation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));
        return switch (prepareForCaptureUnderLock(reservation)) {
            case ALREADY_CONFIRMED -> CaptureFinalizeResult.ALREADY_CONFIRMED;
            case CONFLICT -> CaptureFinalizeResult.UNFULFILLABLE;
            case READY -> {
                reservation.confirm();
                yield CaptureFinalizeResult.CONFIRMED;
            }
        };
    }

    // Room 락 + 결제 가능여부나 충돌여부 확인하고 중복되거나 만료된 상태에 따라 처리방식 바꾸기

    private PrepareOutcome prepareForCaptureUnderLock(Reservation reservation) {
        roomRepository.findByIdForUpdate(reservation.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        // 방 락을 잡은 뒤 최신 커밋 상태를 다시 읽는다(스위퍼/다른 트랜잭션 반영).
        entityManager.refresh(reservation);

        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            return PrepareOutcome.ALREADY_CONFIRMED;
        }

        LocalDateTime now = LocalDateTime.now();
        boolean conflict = reservationRepository.existsOverlappingReservationExcludeCurrentId(
                reservation.getRoomId(), BLOCKING_STATUSES, now,
                reservation.getCheckInDate(), reservation.getCheckOutDate(), reservation.getId());
        if (conflict) {
            return PrepareOutcome.CONFLICT;
        }

        boolean validHold = reservation.getStatus() == ReservationStatus.PENDING
                && reservation.getExpiresAt() != null
                && reservation.getExpiresAt().isAfter(now);
        if (!validHold) {
            reservation.reacquireHold(now.plusMinutes(HOLD_MINUTES));
        }
        return PrepareOutcome.READY;
    }

    private enum PrepareOutcome { READY, ALREADY_CONFIRMED, CONFLICT }

    public enum CaptureFinalizeResult { CONFIRMED, ALREADY_CONFIRMED, UNFULFILLABLE }


    @Transactional
    public void cancelReservation(Long reservationId, Long guestId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));
        if (!reservation.getGuestId().equals(guestId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
        }
        boolean wasConfirmed = reservation.getStatus() == ReservationStatus.CONFIRMED;
        reservation.cancel();
        if(wasConfirmed){
            Room room = roomRepository.findById(reservation.getRoomId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
            applicationEventPublisher.publishEvent(new ReservationCancelledEvent(
                    reservation.getId(), room.getHostId(),room.getId(), room.getName(),reservation.getCheckInDate(),
                    reservation.getCheckOutDate()
            ));
        }
    }

    @Transactional(readOnly = true)
    public Reservation getPayableHold(Long reservationId, Long guestId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));
        if (!reservation.getGuestId().equals(guestId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
        }
        boolean payable = reservation.getStatus() == ReservationStatus.PENDING
                && reservation.getExpiresAt() != null
                && reservation.getExpiresAt().isAfter(LocalDateTime.now());
        if (!payable) {
            throw new BusinessException(ErrorCode.RESERVATION_NOT_PAYABLE);
        }
        return reservation;
    }


    @Transactional
    public ReservationResponse findReservationResponseById(Long memberId, Long reservationId){
        Reservation reservation = reservationRepository.findById(reservationId).orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));
        if(!reservation.getGuestId().equals(memberId)){
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION, "본인의 예약 내역만 조회 가능합니다");
        }
        Room targetRoom = roomRepository.findById(reservation.getRoomId()).orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        return new ReservationResponse(
                reservation.getId(),
                reservation.getRoomId(),
                targetRoom.getName(),
                targetRoom.getRepresentativeImageUrl(),
                targetRoom.getRegion(),
                reservation.getCheckInDate(),
                reservation.getCheckOutDate(),
                reservation.getAdultCount() + reservation.getChildCount(),
                targetRoom.getPricePerNight(),
                reservation.getTotalPrice(),
                reservation.getStatus(),
                reservation.getExpiresAt(),
                reservation.getCreatedAt(),
                reviewRepository.existsByReservationId(reservationId)
        );
    }
    public Reservation findReservationById(Long reservationId){
        Reservation reservation = reservationRepository.findById(reservationId).orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));
        return reservation;
    }

    public Reservation saveReservation(Reservation reservation){
        return reservationRepository.save(reservation);
    }

}
