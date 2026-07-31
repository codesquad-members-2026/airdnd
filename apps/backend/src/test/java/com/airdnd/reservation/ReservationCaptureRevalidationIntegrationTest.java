package com.airdnd.reservation;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 결제 capture 직전 재검증(lockAndPrepareForCapture)을 실제 MySQL(Flyway 적용) 위에서 검증한다.
 * - 만료/취소된 홀드라도 방이 비어 있으면 홀드를 재획득한다.
 * - 다른 예약이 같은 날짜를 점유 중이면 결제 전에 ROOM_ALREADY_BOOKED 로 막는다(과금 방지).
 * - 이미 확정된 예약은 RESERVATION_NOT_PAYABLE 로 막는다.
 */
@SpringBootTest
@Testcontainers
class ReservationCaptureRevalidationIntegrationTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("airdnd")
            .withUsername("airdnd")
            .withPassword("airdnd");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
    }

    // 스케줄러가 테스트 도중 실제 sweep 을 돌려 데이터를 바꾸지 못하게 무력화한다(결정성 확보).
    @MockitoBean
    private ReservationExpirationSweeper sweeper;

    @Autowired
    private ReservationService reservationService;
    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private JdbcTemplate jdbc;

    private static final Long GUEST_ID = 1L;
    private static final LocalDate IN = LocalDate.of(2026, 7, 1);
    private static final LocalDate OUT = LocalDate.of(2026, 7, 5);

    private Long roomId;

    @BeforeEach
    void seed() {
        jdbc.update("DELETE FROM payments");
        jdbc.update("DELETE FROM reservations");
        jdbc.update("DELETE FROM rooms");
        jdbc.update("DELETE FROM members");

        jdbc.update("""
                INSERT INTO members (id, email, nickname, role, oauth_provider, oauth_id, is_deleted)
                VALUES (1, 'guest@test.dev', 'guest', 'GUEST', 'GOOGLE', 'oauth-guest-1', FALSE)
                """);
        jdbc.update("""
                INSERT INTO rooms
                  (host_id, host_name, name, region, address, country_code,
                   latitude, longitude, price_per_night, max_capacity)
                VALUES (1, 'host', 'test room', '서울', 'addr', 'KR', 37.5, 127.0, 100000, 4)
                """);
        roomId = jdbc.queryForObject("SELECT id FROM rooms LIMIT 1", Long.class);
    }

    private Reservation save(ReservationStatus status, LocalDateTime expiresAt) {
        return save(status, IN, OUT, expiresAt);
    }

    private Reservation save(ReservationStatus status, LocalDate in, LocalDate out, LocalDateTime expiresAt) {
        Reservation r = Reservation.builder()
                .guestId(GUEST_ID)
                .roomId(roomId)
                .checkInDate(in)
                .checkOutDate(out)
                .totalPrice(200_000L)
                .adultCount(2)
                .childCount(0)
                .infantCount(0)
                .hasPets(false)
                .status(status)
                .expiresAt(expiresAt)
                .createdAt(LocalDateTime.now())
                .build();
        return reservationRepository.save(r);
    }

    @Test
    @Transactional // load + prepare 가 같은 영속성 컨텍스트를 공유하도록(운영에선 PaymentService.capture 트랜잭션이 제공).
    @DisplayName("만료된 PENDING 홀드라도 방이 비어 있으면 홀드를 재획득한다(상태 PENDING, 만료 시각 갱신).")
    void reacquiresExpiredHoldWhenRoomFree() {
        Reservation expired = save(ReservationStatus.PENDING, LocalDateTime.now().minusMinutes(1));
        Reservation loaded = reservationRepository.findById(expired.getId()).orElseThrow();

        reservationService.lockAndPrepareForCapture(loaded);

        assertThat(loaded.getStatus()).isEqualTo(ReservationStatus.PENDING);
        assertThat(loaded.getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @Transactional
    @DisplayName("스위퍼에 취소된(CANCELLED) 홀드라도 방이 비어 있으면 되살려(PENDING, deletedAt=null) 결제를 이어간다.")
    void reacquiresCancelledHoldWhenRoomFree() {
        Reservation cancelled = save(ReservationStatus.CANCELLED, null);
        Reservation loaded = reservationRepository.findById(cancelled.getId()).orElseThrow();

        reservationService.lockAndPrepareForCapture(loaded);

        assertThat(loaded.getStatus()).isEqualTo(ReservationStatus.PENDING);
        assertThat(loaded.getDeletedAt()).isNull();
        assertThat(loaded.getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @Transactional
    @DisplayName("만료된 홀드 + 같은 날짜의 다른 CONFIRMED 예약이 있으면 ROOM_ALREADY_BOOKED 로 막는다(과금 방지).")
    void rejectsWhenAnotherConfirmedOverlaps() {
        Reservation expired = save(ReservationStatus.PENDING, LocalDateTime.now().minusMinutes(1));
        save(ReservationStatus.CONFIRMED, null); // 다른 사람이 같은 날짜를 확정
        Reservation loaded = reservationRepository.findById(expired.getId()).orElseThrow();

        assertThatThrownBy(() -> reservationService.lockAndPrepareForCapture(loaded))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.ROOM_ALREADY_BOOKED);

        assertThat(loaded.getStatus()).isEqualTo(ReservationStatus.PENDING); // 재획득되지 않음
    }

    @Test
    @Transactional
    @DisplayName("이미 CONFIRMED 된 예약이면 RESERVATION_NOT_PAYABLE 로 막는다.")
    void rejectsWhenAlreadyConfirmed() {
        Reservation confirmed = save(ReservationStatus.CONFIRMED, null);
        Reservation loaded = reservationRepository.findById(confirmed.getId()).orElseThrow();

        assertThatThrownBy(() -> reservationService.lockAndPrepareForCapture(loaded))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.RESERVATION_NOT_PAYABLE);
    }

    @Test
    @Transactional
    @DisplayName("유효한 PENDING 홀드는 그대로 통과시키며 홀드를 재획득하지 않는다(만료 시각 유지).")
    void keepsValidHoldUnchanged() {
        Reservation live = save(ReservationStatus.PENDING, LocalDateTime.now().plusMinutes(10));
        Reservation loaded = reservationRepository.findById(live.getId()).orElseThrow();

        reservationService.lockAndPrepareForCapture(loaded);

        assertThat(loaded.getStatus()).isEqualTo(ReservationStatus.PENDING);
        // 재획득됐다면 만료 시각이 HOLD_MINUTES(1분) 수준으로 줄었을 것 → 원래의 10분 홀드가 유지됨을 확인.
        assertThat(loaded.getExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(5));
    }
}
