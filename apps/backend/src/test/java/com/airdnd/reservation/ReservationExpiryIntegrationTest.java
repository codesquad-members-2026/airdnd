package com.airdnd.reservation;

import com.airdnd.reservation.dto.BookedDateRange;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 홀드 만료 라이프사이클을 실제 MySQL(Flyway V1~V4 적용) 위에서 검증한다.
 * - 일괄 만료 쿼리(sweeper 가 호출하는 bulkCancelExpiredReservations)
 * - 점유 판정의 '지연 만료'(만료된 PENDING 은 방을 막지 않음)
 */
@SpringBootTest
@Testcontainers
class ReservationExpiryIntegrationTest {

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
    private ReservationRepository reservationRepository;

    @Autowired
    private JdbcTemplate jdbc;

    private static final List<ReservationStatus> BLOCKING =
            List.of(ReservationStatus.CONFIRMED, ReservationStatus.PENDING);
    private static final Long GUEST_ID = 1L;

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
    @Transactional // @Modifying 일괄 쿼리는 트랜잭션 안에서 실행돼야 한다(운영에선 sweeper 의 @Transactional 이 제공).
    @DisplayName("일괄 만료: 만료된 PENDING 만 CANCELLED 로 바꾸고 유효 PENDING·CONFIRMED 는 그대로 둔다.")
    void bulkCancelExpiredReservations_onlyExpiredPending() {
        LocalDateTime now = LocalDateTime.now();
        Reservation expired = save(ReservationStatus.PENDING, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3), now.minusMinutes(1));
        Reservation live = save(ReservationStatus.PENDING, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 3), now.plusMinutes(10));
        Reservation confirmed = save(ReservationStatus.CONFIRMED, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 3), null);

        int affected = reservationRepository.bulkCancelExpiredReservations(now);

        assertThat(affected).isEqualTo(1);
        assertThat(reservationRepository.findById(expired.getId()).orElseThrow().getStatus())
                .isEqualTo(ReservationStatus.CANCELLED);
        assertThat(reservationRepository.findById(live.getId()).orElseThrow().getStatus())
                .isEqualTo(ReservationStatus.PENDING);
        assertThat(reservationRepository.findById(confirmed.getId()).orElseThrow().getStatus())
                .isEqualTo(ReservationStatus.CONFIRMED);
    }

    @Test
    @DisplayName("점유 판정: 만료된 PENDING 만 있으면 방은 비어 있는 것으로 보고, 유효 PENDING 이 생기면 막힌다(지연 만료).")
    void existsOverlapping_respectsPendingExpiry() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate in = LocalDate.of(2026, 7, 1);
        LocalDate out = LocalDate.of(2026, 7, 5);

        save(ReservationStatus.PENDING, in, out, now.minusMinutes(1)); // 만료된 홀드
        assertThat(reservationRepository.existsOverlappingReservation(roomId, BLOCKING, now, in, out)).isFalse();

        save(ReservationStatus.PENDING, in, out, now.plusMinutes(10)); // 유효 홀드 추가
        assertThat(reservationRepository.existsOverlappingReservation(roomId, BLOCKING, now, in, out)).isTrue();
    }

    @Test
    @DisplayName("점유 판정: CONFIRMED 는 만료 개념 없이 항상 방을 막는다.")
    void existsOverlapping_confirmedAlwaysBlocks() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate in = LocalDate.of(2026, 7, 1);
        LocalDate out = LocalDate.of(2026, 7, 5);

        save(ReservationStatus.CONFIRMED, in, out, null);

        assertThat(reservationRepository.existsOverlappingReservation(roomId, BLOCKING, now, in, out)).isTrue();
    }

    @Test
    @DisplayName("예약 구간 조회: 만료된 PENDING 은 booked-dates 에서 제외된다.")
    void findBookedRanges_excludesExpiredPending() {
        LocalDateTime now = LocalDateTime.now();
        save(ReservationStatus.PENDING, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3), now.minusMinutes(1)); // 만료
        save(ReservationStatus.PENDING, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 3), now.plusMinutes(10)); // 유효
        save(ReservationStatus.CONFIRMED, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 3), null);

        List<BookedDateRange> ranges =
                reservationRepository.findBookedRanges(roomId, BLOCKING, LocalDate.now(), now);

        assertThat(ranges).hasSize(2);
        assertThat(ranges).noneMatch(r -> r.checkInDate().equals(LocalDate.of(2026, 7, 1)));
    }
}
