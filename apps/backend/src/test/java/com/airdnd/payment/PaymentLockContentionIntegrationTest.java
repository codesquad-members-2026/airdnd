package com.airdnd.payment;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.notification.NotificationService;
import com.airdnd.reservation.Reservation;
import com.airdnd.reservation.ReservationExpirationSweeper;
import com.airdnd.reservation.ReservationRepository;
import com.airdnd.reservation.ReservationService;
import com.airdnd.reservation.ReservationStatus;
import com.airdnd.reservation.dto.ReservationRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willAnswer;

/**
 * 결제 capture 경로의 Room 비관적 잠금(findByIdForUpdate)이 외부 PayPal 호출 동안 유지되어
 * 같은 방을 만지는 다른 트랜잭션을 얼마나, 어떻게 막는지 실제 MySQL(InnoDB) 위에서 측정한다.
 *
 * 핵심 사실(코드/설정 기준):
 *  - PaymentService.capture 는 @Transactional 안에서 Room 행을 FOR UPDATE 로 잡은 뒤
 *    paypalClient.captureOrder() (동기 HTTP) 를 호출한다 → 락은 PayPal 응답까지 유지된다.
 *  - PaypalProperties.readTimeout 기본값은 10s → 락이 최대 ~10s 유지될 수 있다.
 *  - application-prod.yml 은 innodb_lock_wait_timeout = 5 → 대기측은 5s 후 포기(예외)한다.
 *  => 락 유지 시간(≤10s) > 락 대기 한도(5s) 이므로, PayPal 이 5s 넘게 걸리면
 *     같은 방의 동시 예약/결제/스위퍼 복구는 "대기"가 아니라 "실패"한다.
 *
 * 유일하게 가짜로 두는 것은 PayPal 지연시간뿐이다(captureOrder 가 정해진 시간만큼 sleep).
 * Room 락은 진짜 InnoDB 행 잠금이며, 대기측 측정도 별도 커넥션의 SELECT ... FOR UPDATE 로 한다.
 * (실행에 Docker 가 필요하다.)
 */
@SpringBootTest
@Testcontainers
class PaymentLockContentionIntegrationTest {

    /** application-prod.yml: spring.datasource.hikari.connection-init-sql = "SET innodb_lock_wait_timeout = 5" */
    private static final int PROD_LOCK_WAIT_TIMEOUT_SECONDS = 5;
    /** MySQL "lock wait timeout exceeded" */
    private static final int ER_LOCK_WAIT_TIMEOUT = 1205;
    /** MySQL "do not wait for lock" (SELECT ... FOR UPDATE NOWAIT) */
    private static final int ER_LOCK_NOWAIT = 3572;

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
        // 운영과 동일하게 모든 앱 커넥션의 락 대기 한도를 5초로 맞춘다(헤드라인 시나리오의 전제).
        registry.add("spring.datasource.hikari.connection-init-sql",
                () -> "SET innodb_lock_wait_timeout = " + PROD_LOCK_WAIT_TIMEOUT_SECONDS);
    }

    // 스케줄러가 테스트 도중 돌지 못하게 막아 결정성을 확보한다.
    @MockitoBean
    private ReservationExpirationSweeper reservationSweeper;
    @MockitoBean
    private PaymentReconciliationSweeper reconciliationSweeper;
    // 외부 PayPal — 유일하게 제어하는 의존성. captureOrder 가 정해진 시간만큼 잠긴 채 머문다.
    @MockitoBean
    private PaypalClient paypalClient;
    // AFTER_COMMIT 알림 리스너가 실제 알림을 보내지 않도록 무력화.
    @MockitoBean
    private NotificationService notificationService;

    @Autowired
    private PaymentService paymentService;
    @Autowired
    private PaymentReconciliationService reconciliationService;
    @Autowired
    private ReservationService reservationService;
    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private DataSource dataSource;

    private final AtomicLong paypalCaptureDelayMillis = new AtomicLong(0);
    private final Map<String, Long> perOrderDelayMillis = new ConcurrentHashMap<>();
    private final Set<String> failingOrders = ConcurrentHashMap.newKeySet();
    private final ExecutorService async = Executors.newCachedThreadPool();

    private static final Long GUEST_ID = 1L;
    private static final LocalDate IN = LocalDate.of(2026, 7, 1);
    private static final LocalDate OUT = LocalDate.of(2026, 7, 3);

    private Long roomId;

    @BeforeEach
    void seed() throws Exception {
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

        // PayPal capture: 주문별로 지연/실패를 제어한다(맵에 없으면 기본 지연값 사용).
        willAnswer(invocation -> {
            String orderId = invocation.getArgument(0);
            long delay = perOrderDelayMillis.getOrDefault(orderId, paypalCaptureDelayMillis.get());
            Thread.sleep(delay);
            if (failingOrders.contains(orderId)) {
                throw new BusinessException(ErrorCode.PAYMENT_CAPTURE_FAILED); // 결제 문제 발생
            }
            return null;
        }).given(paypalClient).captureOrder(anyString());
        // 복구 경로(reconcileOne)에서 PayPal 이 이미 과금 완료라고 답하도록.
        given(paypalClient.getOrderStatus(anyString())).willReturn("COMPLETED");
    }

    @AfterEach
    void tearDown() {
        async.shutdownNow();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1) 개선 후: PayPal 호출 동안에는 Room 락을 쥐지 않는다 (PayPal < 락 대기 한도)
    // ──────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("[개선] capture 의 PayPal 호출 동안에는 Room 락을 쥐지 않는다 — 같은 방 경쟁자가 즉시 통과한다")
    void roomLockIsNotHeldDuringThePaypalCall() throws Exception {
        paypalCaptureDelayMillis.set(3_000);                 // PayPal 3초
        String orderId = "ORDER-HOLD-1";
        givenPayableReservationWithPayment(orderId);

        CompletableFuture<Void> capturing =
                CompletableFuture.runAsync(() -> paymentService.capture(orderId, GUEST_ID), async);

        awaitCapturing(orderId, 3_000);                      // 1단계 끝나고 PayPal(3초) 진행 중인 시점

        // PayPal 진행 중에 같은 방 락을 시도한다 — 더 이상 잠겨 있지 않으므로 즉시 잡혀야 한다.
        ProbeResult probe = probeRoomLock(PROD_LOCK_WAIT_TIMEOUT_SECONDS);
        System.out.printf("[lock-hold] PayPal=3000ms 진행 중 → competitor acquired in %dms (acquired=%b)%n",
                probe.elapsedMillis(), probe.acquired());

        assertThat(probe.acquired()).isTrue();
        assertThat(probe.elapsedMillis())
                .as("PayPal 이 3초 걸려도 방은 잠겨 있지 않아 경쟁자가 즉시(<1초) 통과한다")
                .isLessThan(1_000);

        capturing.get(15, TimeUnit.SECONDS);
        assertThat(paymentRepository.findByPaypalOrderId(orderId).orElseThrow().getStatus())
                .isEqualTo(PaymentStatus.CAPTURED);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2) 헤드라인(개선): PayPal 이 락 대기 한도를 넘겨도 같은 방 작업이 막히지 않는다
    // ──────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("[개선] PayPal 이 5초를 넘겨도(6s) 같은 방 경쟁 트랜잭션은 락 타임아웃 없이 즉시 통과한다")
    void slowPaypalNoLongerBlocksCompetitors() throws Exception {
        paypalCaptureDelayMillis.set(6_000);                 // PayPal 6초 (> 5초 한도)
        String orderId = "ORDER-SLOW-1";
        givenPayableReservationWithPayment(orderId);

        CompletableFuture<Void> capturing =
                CompletableFuture.runAsync(() -> paymentService.capture(orderId, GUEST_ID), async);

        awaitCapturing(orderId, 3_000);

        ProbeResult probe = probeRoomLock(PROD_LOCK_WAIT_TIMEOUT_SECONDS);
        System.out.printf("[cross-timeout] PayPal=6000ms 진행 중, lockWaitTimeout=5s → competitor %s in %dms%n",
                probe.acquired() ? "acquired" : "FAILED", probe.elapsedMillis());

        assertThat(probe.acquired())
                .as("PayPal 이 6초 걸려도 방은 잠겨 있지 않아 타임아웃이 발생하지 않는다")
                .isTrue();
        assertThat(probe.elapsedMillis()).isLessThan(1_000);

        capturing.get(15, TimeUnit.SECONDS);
        assertThat(paymentRepository.findByPaypalOrderId(orderId).orElseThrow().getStatus())
                .isEqualTo(PaymentStatus.CAPTURED);
    }

    @Test
    @DisplayName("[개선] 느린 capture 진행 중에도 같은 방의 다른 날짜 신규 예약은 락 타임아웃 없이 성공한다")
    void concurrentReservationSucceedsDuringSlowCapture() throws Exception {
        paypalCaptureDelayMillis.set(6_000);
        String orderId = "ORDER-SLOW-2";
        givenPayableReservationWithPayment(orderId);

        CompletableFuture<Void> capturing =
                CompletableFuture.runAsync(() -> paymentService.capture(orderId, GUEST_ID), async);

        awaitCapturing(orderId, 3_000);

        // 겹치지 않는 날짜의 신규 예약 — 더 이상 PayPal 락에 막히지 않으므로 정상 성공한다.
        ReservationRequest newBooking = new ReservationRequest(
                roomId, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 3), 2, 0, 0, false);

        Long newReservationId = reservationService.createReservation(GUEST_ID, newBooking);
        assertThat(newReservationId).isNotNull();

        capturing.get(15, TimeUnit.SECONDS);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3) 복구(스위퍼) 경로도 같은 Room 락을 쓴다 → 방이 잠겨 있으면 복구도 타임아웃
    // ──────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("복구용 reconcileOne 도 같은 Room 락을 잡으므로, 방이 잠겨 있으면 5초 후 락 타임아웃으로 실패한다")
    void reconciliationContendsForTheSameRoomLock() throws Exception {
        String orderId = "ORDER-STUCK-1";
        Long paymentId = givenStuckCapturingPayment(orderId);

        // 누군가(다른 capture 등) Room 락을 6초간 쥐고 있는 상황을 별도 커넥션으로 재현.
        CompletableFuture<Void> holder = CompletableFuture.runAsync(() -> holdRoomLock(6_000), async);
        awaitRoomLocked(3_000);

        // 스위퍼가 깨어나 같은 방을 확정하려 하면 같은 락을 두고 경쟁 → 5초 후 타임아웃.
        assertThatThrownBy(() -> reconciliationService.reconcileOne(paymentId))
                .isInstanceOf(PessimisticLockingFailureException.class);

        holder.get(15, TimeUnit.SECONDS);
        // 복구가 실패했으므로 결제는 아직 CAPTURING 그대로(다음 스위퍼 주기에 재시도된다).
        assertThat(paymentRepository.findById(paymentId).orElseThrow().getStatus())
                .isEqualTo(PaymentStatus.CAPTURING);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4) 컨텐션 폭풍: 한 결제가 PayPal 문제로 락을 쥔 채 멈춘 동안,
    //    같은 방에 다른 결제(capture)들과 신규 예약들이 동시에 줄을 선다.
    // ──────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("결제 문제로 한 capture 가 락을 쥔 사이, 같은 방의 다른 결제·예약 다수가 동시에 줄서면 5초 락 한도에서 무더기로 실패한다")
    void contentionStormWhilePaymentIsStuck() throws Exception {
        int otherCaptures = 5;     // 같은 방, 서로 다른 날짜의 다른 결제들
        int newReservations = 4;   // 같은 방에 동시에 들어오는 신규 예약 요청들

        // 0번 슬롯: PayPal 이 4초 머문 뒤 실패하는 "문제 결제" — 락을 먼저 쥐고 멈춘다.
        String problemOrder = seedPayableCapture(0);
        perOrderDelayMillis.put(problemOrder, 4_000L);
        failingOrders.add(problemOrder);

        // 1..N: 정상 결제들(각 PayPal 3초). 같은 Room 락을 두고 경쟁한다.
        List<String> otherOrders = new ArrayList<>();
        for (int i = 1; i <= otherCaptures; i++) {
            String orderId = seedPayableCapture(i);
            perOrderDelayMillis.put(orderId, 3_000L);
            otherOrders.add(orderId);
        }

        List<RequestStat> stats = new CopyOnWriteArrayList<>();
        long epoch = System.nanoTime();                      // 모든 시작/소요 시간의 0점

        // 문제 결제를 먼저 출발시키고 PayPal 진행 중(CAPTURING) 상태가 될 때까지 기다린다(폭풍의 발화점).
        CompletableFuture<Void> problem = CompletableFuture.runAsync(
                () -> stats.add(runCapture(problemOrder, problemOrder, epoch)), async);
        awaitCapturing(problemOrder, 3_000);

        // 이제 나머지 결제 + 신규 예약을 한꺼번에 발사한다.
        int stormSize = otherCaptures + newReservations;
        CountDownLatch ready = new CountDownLatch(stormSize);
        CountDownLatch fire = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(stormSize);

        for (String orderId : otherOrders) {
            CompletableFuture.runAsync(() -> {
                ready.countDown();
                awaitQuietly(fire);
                stats.add(runCapture(orderId, orderId, epoch));
                done.countDown();
            }, async);
        }
        for (int i = 0; i < newReservations; i++) {
            String label = "RES-" + i;
            ReservationRequest req = newBookingRequest(i);
            CompletableFuture.runAsync(() -> {
                ready.countDown();
                awaitQuietly(fire);
                stats.add(runReservation(label, req, epoch));
                done.countDown();
            }, async);
        }

        ready.await();
        long t0 = System.nanoTime();
        fire.countDown();                                    // 동시에 출발
        assertThat(done.await(60, TimeUnit.SECONDS)).isTrue();
        problem.get(60, TimeUnit.SECONDS);
        long wallMillis = millisSince(t0);

        report("Contention storm", stats, wallMillis);
        writeCsv("contention-storm", stats);

        Map<Outcome, Integer> tally = tally(stats);

        // 모든 스레드가 알려진 결과로 끝났다(예상 못한 예외 없음).
        assertThat(stats).hasSize(1 + stormSize);
        assertThat(tally.getOrDefault(Outcome.OTHER, 0)).isZero();

        // 문제 결제는 PayPal 에서 실패했지만 더 이상 락을 쥐지 않는다 → CAPTURING 으로 남아 복구 대상이 된다.
        assertThat(tally.getOrDefault(Outcome.PAYMENT_FAILED, 0)).isEqualTo(1);
        assertThat(paymentRepository.findByPaypalOrderId(problemOrder).orElseThrow().getStatus())
                .as("문제 결제는 REQUIRES_NEW 마커 때문에 CAPTURING 으로 남는다(스위퍼가 나중에 복구)")
                .isEqualTo(PaymentStatus.CAPTURING);

        // 개선의 핵심: PayPal 호출이 더 이상 Room 락을 쥐지 않으므로 락 대기 타임아웃이 사라진다.
        assertThat(tally.getOrDefault(Outcome.LOCK_TIMEOUT, 0))
                .as("PayPal 을 락 밖으로 빼낸 뒤에는 같은 방 동시 요청이 더 이상 락 타임아웃으로 실패하지 않는다")
                .isZero();
        // 문제 결제를 제외한 나머지(다른 날짜의 결제·예약)는 모두 성공한다.
        assertThat(tally.getOrDefault(Outcome.SUCCESS, 0)).isEqualTo(stormSize);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5) 순차 도착: 첫 결제가 PayPal 문제로 방을 잠근 동안,
    //    이후 요청들이 한꺼번에가 아니라 일정 간격으로 하나씩 도착해 줄을 선다.
    //    각 요청은 "도착한 순간"부터 자기만의 5초 락 대기 시계를 시작한다.
    // ──────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("첫 결제가 방을 잠근 채 멈춘 동안 10개의 결제가 0.5초 간격으로 순차 도착하면, 도착 시점에 따라 일부만 통과하고 나머지는 5초 후 타임아웃된다")
    void sequentialArrivalsBehindStuckPayment() throws Exception {
        int arrivals = 10;
        long interArrivalMillis = 500;

        // 0번: PayPal 이 4초 머문 뒤 실패하는 "문제 결제" — 먼저 락을 쥔다.
        String problemOrder = seedPayableCapture(0);
        perOrderDelayMillis.put(problemOrder, 4_000L);
        failingOrders.add(problemOrder);

        // 1..10: 각 PayPal 3초짜리 정상 결제. 미리 시드해 둔다.
        List<String> orders = new ArrayList<>();
        for (int i = 1; i <= arrivals; i++) {
            String orderId = seedPayableCapture(i);
            perOrderDelayMillis.put(orderId, 3_000L);
            orders.add(orderId);
        }

        List<RequestStat> stats = new CopyOnWriteArrayList<>();
        long epoch = System.nanoTime();

        // 문제 결제 출발 + PayPal 진행 중(CAPTURING) 대기.
        CompletableFuture<Void> problem = CompletableFuture.runAsync(
                () -> stats.add(runCapture(problemOrder, problemOrder, epoch)), async);
        awaitCapturing(problemOrder, 3_000);

        // 이후 요청들이 0.5초 간격으로 "하나씩" 도착한다.
        List<CompletableFuture<Void>> launched = new ArrayList<>();
        for (String orderId : orders) {
            launched.add(CompletableFuture.runAsync(
                    () -> stats.add(runCapture(orderId, orderId, epoch)), async));
            Thread.sleep(interArrivalMillis);
        }

        CompletableFuture.allOf(launched.toArray(CompletableFuture[]::new)).get(120, TimeUnit.SECONDS);
        problem.get(120, TimeUnit.SECONDS);
        long wallMillis = millisSince(epoch);

        report("Sequential arrivals", stats, wallMillis);
        writeCsv("sequential-arrivals", stats);

        Map<Outcome, Integer> tally = tally(stats);
        assertThat(stats).hasSize(1 + arrivals);
        assertThat(tally.getOrDefault(Outcome.OTHER, 0)).isZero();

        // 문제 결제는 PayPal 에서 실패했지만 락을 쥐지 않는다 → CAPTURING 으로 남아 복구 대상.
        assertThat(tally.getOrDefault(Outcome.PAYMENT_FAILED, 0)).isEqualTo(1);
        assertThat(paymentRepository.findByPaypalOrderId(problemOrder).orElseThrow().getStatus())
                .isEqualTo(PaymentStatus.CAPTURING);

        // 개선 후: 멈춘 결제가 방을 잠그지 않으므로 순차 도착한 결제들이 모두 통과하고 타임아웃이 사라진다.
        assertThat(tally.getOrDefault(Outcome.LOCK_TIMEOUT, 0))
                .as("멈춘 결제가 락을 쥐지 않으므로 뒤따라 도착한 결제는 더 이상 타임아웃되지 않는다")
                .isZero();
        assertThat(tally.getOrDefault(Outcome.SUCCESS, 0))
                .as("순차 도착한 결제 전부가 성공한다").isEqualTo(arrivals);
    }

    private RequestStat runCapture(String label, String orderId, long epoch) {
        long startOffset = millisSince(epoch);
        long start = System.nanoTime();
        Outcome outcome;
        try {
            paymentService.capture(orderId, GUEST_ID);
            outcome = Outcome.SUCCESS;
        } catch (PessimisticLockingFailureException e) {
            outcome = Outcome.LOCK_TIMEOUT;
        } catch (BusinessException e) {
            outcome = e.getCode() == ErrorCode.PAYMENT_CAPTURE_FAILED ? Outcome.PAYMENT_FAILED
                    : e.getCode() == ErrorCode.ROOM_ALREADY_BOOKED ? Outcome.ROOM_ALREADY_BOOKED
                    : Outcome.OTHER;
        } catch (Exception e) {
            outcome = Outcome.OTHER;
        }
        return new RequestStat("CAPTURE", label, outcome, startOffset, millisSince(start));
    }

    private RequestStat runReservation(String label, ReservationRequest req, long epoch) {
        long startOffset = millisSince(epoch);
        long start = System.nanoTime();
        Outcome outcome;
        try {
            reservationService.createReservation(GUEST_ID, req);
            outcome = Outcome.SUCCESS;
        } catch (PessimisticLockingFailureException e) {
            outcome = Outcome.LOCK_TIMEOUT;
        } catch (BusinessException e) {
            outcome = e.getCode() == ErrorCode.ROOM_ALREADY_BOOKED ? Outcome.ROOM_ALREADY_BOOKED : Outcome.OTHER;
        } catch (Exception e) {
            outcome = Outcome.OTHER;
        }
        return new RequestStat("RESERVATION", label, outcome, startOffset, millisSince(start));
    }

    private enum Outcome { SUCCESS, LOCK_TIMEOUT, PAYMENT_FAILED, ROOM_ALREADY_BOOKED, OTHER }

    /** 한 요청의 측정 결과: 종류 / 식별자 / 결과 / 시작시각(0점 기준) / 소요시간(ms). */
    private record RequestStat(String kind, String label, Outcome outcome,
                               long startOffsetMillis, long elapsedMillis) {}

    private static Map<Outcome, Integer> tally(List<RequestStat> stats) {
        Map<Outcome, Integer> tally = new EnumMap<>(Outcome.class);
        for (RequestStat s : stats) {
            tally.merge(s.outcome(), 1, Integer::sum);
        }
        return tally;
    }

    /** 요청별 표 + 결과/전체 백분위 요약을 stdout 으로 찍는다(리포트용). */
    private static void report(String title, List<RequestStat> stats, long wallMillis) {
        List<RequestStat> sorted = new ArrayList<>(stats);
        sorted.sort((a, b) -> Long.compare(a.startOffsetMillis(), b.startOffsetMillis()));

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%n[%s] requests=%d wall=%dms%n", title, stats.size(), wallMillis));
        sb.append(String.format("  %-12s %-12s %-18s %10s %10s%n",
                "LABEL", "KIND", "OUTCOME", "start(ms)", "took(ms)"));
        for (RequestStat s : sorted) {
            sb.append(String.format("  %-12s %-12s %-18s %10d %10d%n",
                    s.label(), s.kind(), s.outcome(), s.startOffsetMillis(), s.elapsedMillis()));
        }
        sb.append("  ── latency by outcome ──").append(System.lineSeparator());
        Map<Outcome, List<Long>> byOutcome = new EnumMap<>(Outcome.class);
        for (RequestStat s : stats) {
            byOutcome.computeIfAbsent(s.outcome(), k -> new ArrayList<>()).add(s.elapsedMillis());
        }
        byOutcome.forEach((o, ds) -> sb.append("  ").append(summary(o.name(), ds)).append(System.lineSeparator()));
        sb.append("  ").append(summary("ALL", stats.stream().map(RequestStat::elapsedMillis).toList()));
        System.out.println(sb);
    }

    private static String summary(String name, List<Long> durations) {
        List<Long> ds = new ArrayList<>(durations);
        ds.sort(Long::compareTo);
        long min = ds.get(0), max = ds.get(ds.size() - 1);
        double avg = ds.stream().mapToLong(Long::longValue).average().orElse(0);
        return String.format("%-18s n=%-3d min=%-6d p50=%-6d p95=%-6d max=%-6d avg=%.0f",
                name, ds.size(), min, percentile(ds, 50), percentile(ds, 95), max, avg);
    }

    private static long percentile(List<Long> sortedAsc, int p) {
        if (sortedAsc.isEmpty()) return 0;
        int idx = (int) Math.ceil(p / 100.0 * sortedAsc.size()) - 1;
        return sortedAsc.get(Math.max(0, Math.min(idx, sortedAsc.size() - 1)));
    }

    /** 요청별 결과를 build/reports/&lt;name&gt;.csv 로 남겨 스프레드시트/그래프에 쓰게 한다. */
    private static void writeCsv(String name, List<RequestStat> stats) {
        try {
            Path dir = Path.of("build", "reports");
            Files.createDirectories(dir);
            Path file = dir.resolve(name + ".csv");
            StringBuilder sb = new StringBuilder("label,kind,outcome,start_ms,duration_ms\n");
            for (RequestStat s : stats) {
                sb.append(String.format("%s,%s,%s,%d,%d%n",
                        s.label(), s.kind(), s.outcome(), s.startOffsetMillis(), s.elapsedMillis()));
            }
            Files.writeString(file, sb.toString());
            System.out.println("[Contention storm] per-request CSV → " + file.toAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static void awaitQuietly(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /** 같은 방·서로 겹치지 않는 날짜의 PENDING 홀드 + CREATED 결제를 만들고 orderId 를 돌려준다. */
    private String seedPayableCapture(int idx) {
        LocalDate in = LocalDate.of(2026, 9, 1).plusDays(idx * 3L);
        Reservation reservation = reservationRepository.save(Reservation.builder()
                .guestId(GUEST_ID).roomId(roomId)
                .checkInDate(in).checkOutDate(in.plusDays(2))
                .totalPrice(200_000L).adultCount(2).childCount(0).infantCount(0).hasPets(false)
                .status(ReservationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .createdAt(LocalDateTime.now())
                .build());
        String orderId = "STORM-CAP-" + idx;
        savePayment(orderId, reservation.getId(), PaymentStatus.CREATED);
        return orderId;
    }

    /** 같은 방·서로 겹치지 않는 미래 날짜의 신규 예약 요청. */
    private ReservationRequest newBookingRequest(int idx) {
        LocalDate in = LocalDate.of(2027, 1, 1).plusDays(idx * 3L);
        return new ReservationRequest(roomId, in, in.plusDays(2), 2, 0, 0, false);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    /** 유효한 PENDING 홀드 + CREATED 결제를 만들어 capture 가능 상태로 둔다. */
    private void givenPayableReservationWithPayment(String orderId) {
        Reservation reservation = reservationRepository.save(Reservation.builder()
                .guestId(GUEST_ID).roomId(roomId)
                .checkInDate(IN).checkOutDate(OUT)
                .totalPrice(200_000L).adultCount(2).childCount(0).infantCount(0).hasPets(false)
                .status(ReservationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .createdAt(LocalDateTime.now())
                .build());
        savePayment(orderId, reservation.getId(), PaymentStatus.CREATED);
    }

    /** 이미 CAPTURING 으로 멈춘(과금됐지만 미확정) 결제 — 스위퍼 복구 대상. */
    private Long givenStuckCapturingPayment(String orderId) {
        Reservation reservation = reservationRepository.save(Reservation.builder()
                .guestId(GUEST_ID).roomId(roomId)
                .checkInDate(IN).checkOutDate(OUT)
                .totalPrice(200_000L).adultCount(2).childCount(0).infantCount(0).hasPets(false)
                .status(ReservationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .createdAt(LocalDateTime.now())
                .build());
        return savePayment(orderId, reservation.getId(), PaymentStatus.CAPTURING).getId();
    }

    private Payment savePayment(String orderId, Long reservationId, PaymentStatus status) {
        Payment payment = Payment.builder()
                .paypalOrderId(orderId)
                .reservationId(reservationId)
                .paypalAmount(BigDecimal.valueOf(150.00))
                .currency("USD")
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();
        return paymentRepository.save(payment);
    }

    /** 결제가 1단계를 끝내고 PayPal 진행 중(CAPTURING) 상태가 될 때까지 폴링한다. */
    private void awaitCapturing(String orderId, long timeoutMillis) throws Exception {
        long deadline = System.nanoTime() + timeoutMillis * 1_000_000L;
        while (System.nanoTime() < deadline) {
            PaymentStatus status = paymentRepository.findByPaypalOrderId(orderId)
                    .map(Payment::getStatus).orElse(null);
            if (status == PaymentStatus.CAPTURING) {
                return;
            }
            Thread.sleep(20);
        }
        throw new IllegalStateException(orderId + " 가 " + timeoutMillis + "ms 안에 CAPTURING 이 되지 않았다");
    }

    /** capture/holder 가 Room 행 락을 실제로 잡을 때까지 NOWAIT 프로브로 폴링한다. */
    private void awaitRoomLocked(long timeoutMillis) throws Exception {
        long deadline = System.nanoTime() + timeoutMillis * 1_000_000L;
        while (System.nanoTime() < deadline) {
            try (Connection c = dataSource.getConnection()) {
                c.setAutoCommit(false);
                try (PreparedStatement ps =
                             c.prepareStatement("SELECT id FROM rooms WHERE id = ? FOR UPDATE NOWAIT")) {
                    ps.setLong(1, roomId);
                    ps.executeQuery();
                    c.rollback(); // 아직 아무도 안 잡음 → 잠시 후 재시도
                } catch (SQLException locked) {
                    if (locked.getErrorCode() == ER_LOCK_NOWAIT
                            || locked.getErrorCode() == ER_LOCK_WAIT_TIMEOUT) {
                        return; // 락이 잡혀 있다
                    }
                    throw locked;
                }
            }
            Thread.sleep(25);
        }
        throw new IllegalStateException("Room 락이 " + timeoutMillis + "ms 안에 잡히지 않았다");
    }

    /** 별도 커넥션에서 주어진 락 대기 한도로 Room 행 락 획득을 시도하고, 걸린 시간/결과를 돌려준다. */
    private ProbeResult probeRoomLock(int lockWaitTimeoutSeconds) throws SQLException {
        long start = System.nanoTime();
        try (Connection c = dataSource.getConnection()) {
            c.setAutoCommit(false);
            try (Statement s = c.createStatement()) {
                s.execute("SET innodb_lock_wait_timeout = " + lockWaitTimeoutSeconds);
            }
            try (PreparedStatement ps =
                         c.prepareStatement("SELECT id FROM rooms WHERE id = ? FOR UPDATE")) {
                ps.setLong(1, roomId);
                ps.executeQuery();
                long elapsed = millisSince(start);
                c.rollback();
                return new ProbeResult(true, elapsed, null);
            } catch (SQLException e) {
                long elapsed = millisSince(start);
                c.rollback();
                return new ProbeResult(false, elapsed, e.getErrorCode());
            }
        }
    }

    /** 별도 커넥션으로 Room 행 락을 잡고 지정 시간만큼 쥐고 있는다(경쟁 상황 재현). */
    private void holdRoomLock(long holdMillis) {
        try (Connection c = dataSource.getConnection()) {
            c.setAutoCommit(false);
            try (PreparedStatement ps =
                         c.prepareStatement("SELECT id FROM rooms WHERE id = ? FOR UPDATE")) {
                ps.setLong(1, roomId);
                ps.executeQuery();
                Thread.sleep(holdMillis);
                c.rollback();
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static long millisSince(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000L;
    }

    private record ProbeResult(boolean acquired, long elapsedMillis, Integer sqlErrorCode) {}
}
