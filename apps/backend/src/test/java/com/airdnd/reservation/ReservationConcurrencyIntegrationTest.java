package com.airdnd.reservation;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.reservation.dto.ReservationRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Option A(비관적 잠금 + 잠금 내부 중복 검사)가 실제 MySQL(InnoDB row lock)에서
 * 동시 예약을 직렬화하여 "정확히 한 건만" 성공시키는지 검증한다.
 * H2 인메모리로는 InnoDB 잠금 의미를 재현할 수 없어 Testcontainers MySQL 을 사용한다.
 * (실행에 Docker 가 필요하다.)
 */
@SpringBootTest
@Testcontainers
class ReservationConcurrencyIntegrationTest {

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
        // 스키마는 Flyway 마이그레이션(V1, V2)으로만 만든다.
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
    }

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private JdbcTemplate jdbc;

    private Long guestId;
    private Long roomId;

    @BeforeEach
    void seed() {
        jdbc.update("DELETE FROM reservations");
        jdbc.update("DELETE FROM rooms");
        jdbc.update("DELETE FROM members");

        jdbc.update("""
                INSERT INTO members (id, email, nickname, role, oauth_provider, oauth_id, is_deleted)
                VALUES (1, 'guest@test.dev', 'guest', 'GUEST', 'GOOGLE', 'oauth-guest-1', FALSE)
                """);
        guestId = 1L;

        jdbc.update("""
                INSERT INTO rooms
                  (host_id, host_name, name, region, address, country_code,
                   latitude, longitude, price_per_night, max_capacity)
                VALUES (1, 'host', 'test room', '서울', 'addr', 'KR', 37.5, 127.0, 100000, 4)
                """);
        roomId = jdbc.queryForObject("SELECT id FROM rooms LIMIT 1", Long.class);
    }

    @Test
    @DisplayName("동일 숙소·동일 날짜로 두 요청이 동시에 들어오면 정확히 한 건만 성공한다.")
    void onlyOneWinsUnderConcurrency() throws InterruptedException {
        int threads = 2;
        ReservationRequest request = new ReservationRequest(
                roomId, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3),
                2, 0, 0, false);

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch fire = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger success = new AtomicInteger();
        AtomicInteger alreadyBooked = new AtomicInteger();
        AtomicInteger other = new AtomicInteger();

        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                try {
                    ready.countDown();
                    fire.await();                       // 두 스레드를 동시에 출발
                    reservationService.createReservation(guestId, request);
                    success.incrementAndGet();
                } catch (BusinessException e) {
                    if (e.getCode() == ErrorCode.ROOM_ALREADY_BOOKED) {
                        alreadyBooked.incrementAndGet();
                    } else {
                        other.incrementAndGet();
                    }
                } catch (Exception e) {
                    other.incrementAndGet();
                } finally {
                    done.countDown();
                }
            });
        }

        ready.await();
        fire.countDown();
        assertThat(done.await(15, TimeUnit.SECONDS)).isTrue();
        pool.shutdownNow();

        // 정확히 한 건 성공, 한 건은 중복으로 거절, 그 외 예외 없음
        assertThat(success.get()).isEqualTo(1);
        assertThat(alreadyBooked.get()).isEqualTo(1);
        assertThat(other.get()).isZero();

        // DB 에도 단 한 건만 남아 있어야 한다.
        assertThat(reservationRepository.findByRoomId(roomId)).hasSize(1);
    }
}
