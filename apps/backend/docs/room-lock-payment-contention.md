# 결제 경로 Room 비관적 잠금 부하 테스트 결과

## 1. 배경 — 무엇을 테스트했나

`PaymentService.capture()` 는 `@Transactional` 안에서 Room 행을 `SELECT ... FOR UPDATE`
(`findByIdForUpdate`) 로 잠근 뒤, **그 잠금을 쥔 채** 외부 PayPal 결제 호출
(`paypalClient.captureOrder()`)을 동기로 수행한다. 즉 **Room 잠금이 PayPal 응답까지 유지**된다.

핵심 설정값:

| 항목 | 값 | 출처 |
|---|---|---|
| PayPal read timeout | **10s** | `PaypalProperties.readTimeout` |
| InnoDB 락 대기 한도 | **5s** | `application-prod.yml` `SET innodb_lock_wait_timeout = 5` |

> 잠금 유지 시간(최대 ~10s) > 락 대기 한도(5s) 이므로,
> PayPal 이 5초보다 오래 걸리면 같은 방의 동시 요청은 **대기**가 아니라 **실패**한다.

검증 방식: 실제 MySQL 8.4(Testcontainers, Flyway) 위에서 진짜 InnoDB 행 잠금으로 측정.
유일하게 가짜로 둔 것은 PayPal 지연/실패뿐(`@MockitoBean PaypalClient`).
테스트 파일: `src/test/java/com/airdnd/payment/PaymentLockContentionIntegrationTest.java`

---

## 2. 시나리오 A — 동시 폭주(Contention storm)

첫 결제가 PayPal 문제로 방을 잠근 동안, **나머지 결제 5건 + 신규 예약 4건이 동시에** 같은 방으로 몰린다.

- 문제 결제(STORM-CAP-0): PayPal 4초 후 **실패**, 그 4초간 Room 잠금 점유
- 정상 결제 5건: 각 PayPal 3초
- 신규 예약 4건: PayPal 호출 없음(짧음)

### 결과

```
[Contention storm] requests=10 wall=7047ms
  LABEL        KIND         OUTCOME             start(ms)   took(ms)
  STORM-CAP-0  CAPTURE      PAYMENT_FAILED              0       4018
  RES-3        RESERVATION  SUCCESS                    35       4002
  RES-1        RESERVATION  SUCCESS                    35       4008
  RES-0        RESERVATION  SUCCESS                    35       4013
  RES-2        RESERVATION  SUCCESS                    35       4018
  STORM-CAP-4  CAPTURE      LOCK_TIMEOUT               35       5024
  STORM-CAP-5  CAPTURE      LOCK_TIMEOUT               35       5024
  STORM-CAP-2  CAPTURE      LOCK_TIMEOUT               35       5024
  STORM-CAP-1  CAPTURE      LOCK_TIMEOUT               35       5025
  STORM-CAP-3  CAPTURE      SUCCESS                    35       7047
```

| 결과 | 건수 | min | p50 | p95 | max | avg |
|---|---|---|---|---|---|---|
| SUCCESS | 5 | 4002 | 4013 | 7047 | 7047 | 4618 |
| LOCK_TIMEOUT | 4 | 5024 | 5024 | 5025 | 5025 | 5024 |
| PAYMENT_FAILED | 1 | 4018 | 4018 | 4018 | 4018 | 4018 |
| 전체 | 10 | 4002 | 4018 | 7047 | 7047 | 4720 |

### 해석

- **결제(capture) 5건 중 4건이 실패**(LOCK_TIMEOUT). 모두 ~5024ms 에서 멈췄다 → `innodb_lock_wait_timeout=5s` 절벽.
- 통과한 결제 1건은 **7047ms** 소요(멈춘 결제 4초 대기 + 자기 PayPal 3초).
- 짧은 신규 예약은 멈춘 결제가 풀린 직후 빈틈으로 통과했지만, 그래도 **약 4초의 잠금 대기 비용**을 그대로 지불했다.
- 한 줄 요약: **결제 하나가 막히면 같은 방의 동시 결제 대부분이 실패하고, 성공한 요청도 4~7초 지연된다.**

---

## 3. 시나리오 B — 순차 도착(Sequential arrivals)

첫 결제가 방을 잠근 동안, 이후 **10건의 결제가 0.5초 간격으로 하나씩 순차 도착**한다.
각 요청은 "도착한 순간"부터 자기만의 5초 락 대기 시계를 시작한다.

- 문제 결제(STORM-CAP-0): PayPal 4초 후 실패, 그 동안 잠금 점유
- 이후 결제 10건: 각 PayPal 3초, 0.5초 간격 도착

### 결과

```
[Sequential arrivals] requests=11 wall=10071ms
  LABEL         OUTCOME          start(ms)   took(ms)
  STORM-CAP-0   PAYMENT_FAILED           0       4014
  STORM-CAP-1   SUCCESS                 28       7018
  STORM-CAP-2   LOCK_TIMEOUT           533       5050
  STORM-CAP-3   LOCK_TIMEOUT          1038       5551
  STORM-CAP-4   LOCK_TIMEOUT          1543       5045
  STORM-CAP-5   SUCCESS               2045       8025
  STORM-CAP-6   LOCK_TIMEOUT          2548       5504
  STORM-CAP-7   LOCK_TIMEOUT          3052       6003
  STORM-CAP-8   LOCK_TIMEOUT          3556       5499
  STORM-CAP-9   LOCK_TIMEOUT          4060       6000
  STORM-CAP-10  LOCK_TIMEOUT          4565       5495
```

| 결과 | 건수 | min | p50 | p95 | max | avg |
|---|---|---|---|---|---|---|
| SUCCESS | 2 | 7018 | 7018 | 8025 | 8025 | 7522 |
| LOCK_TIMEOUT | 8 | 5045 | 5499 | 6003 | 6003 | 5518 |
| PAYMENT_FAILED | 1 | 4014 | 4014 | 4014 | 4014 | 4014 |
| 전체 | 11 | 4014 | 5504 | 8025 | 8025 | 5746 |

### 해석

- **각 요청의 시계가 도착 시점부터 시작**하므로, 실패 요청의 소요시간이 도착 시각과 무관하게 **~5000~6000ms 대역**에 몰린다 → 락 대기 한도 절벽이 가로선으로 뚜렷하다.
- 처리량이 **결제당 ~3초(PayPal 점유)로 제한**된다. 방이 빠지는 속도(3s/건)가 도착 속도(0.5s/건)보다 느려 큐가 계속 쌓인다.
- **0.5초 간격의 완만한 도착만으로도 결제 10건 중 8건이 실패**했다. 즉 순간 폭주가 아니라 **지속적인 도착률**만으로도 무너진다.

---

## 3-2. 개선 적용 후 — PayPal 호출을 Room 락 밖으로 분리

`PaymentService.capture()` 를 **세 단계**로 분해했다. 핵심은 외부 PayPal 호출을 Room 락 밖에서 수행하는 것.

1. **1단계(짧은 트랜잭션):** Room 락으로 점유 재검증 + `CAPTURING` 마킹 → 커밋과 함께 락 해제.
   `PENDING` 홀드가 슬롯을 선점하므로 락 없이도 다른 요청이 같은 날짜를 못 가져간다.
2. **2단계(락 없음):** 외부 PayPal capture. 더 이상 Room 락(그리고 DB 커넥션)을 쥐지 않는다.
3. **3단계(짧은 트랜잭션):** 예약 확정 + 결제 `CAPTURED` + 이벤트. 확정 로직은 스위퍼 복구 경로와 동일.

> 2단계 직후 죽어도 결제는 `CAPTURING` 으로 남아 스위퍼가 복구한다(기존 안전장치 유지).

### 코드 비교 (before / after)

**개선 전** — `capture()` 전체가 하나의 `@Transactional`. Room 락을 잡은 채 PayPal 을 호출하고,
그 락은 메서드가 커밋될 때까지(= PayPal 응답 이후까지) 유지된다.

```java
@Transactional                                  // ← 메서드 전체가 한 트랜잭션
public CaptureResponse capture(String orderId, Long guestId) {
    Payment payment = paymentRepository.findByPaypalOrderId(orderId).orElseThrow(...);
    Reservation reservation = reservationService.findReservationById(payment.getReservationId());
    // ... 소유자/중복 capture 검증 ...

    reservationService.lockAndPrepareForCapture(reservation); // Room FOR UPDATE (이 트랜잭션에 합류)
    paymentCaptureMarker.markCapturing(payment.getId());

    paypalClient.captureOrder(orderId);   // ❗ Room 락을 쥔 채 외부 호출 → 커밋까지 락 유지(최대 ~10s)
    payment.markCaptured();
    paymentRepository.save(payment);
    reservation.confirm();
    reservationService.saveReservation(reservation);
    // ... ReservationConfirmedEvent 발행 ...
    return new CaptureResponse(payment.getReservationId());
}                                                // ← 여기서야 커밋 = 락 해제
```

```
락 점유:  ├──[lock]──[revalidate]──[PayPal captureOrder ~3~10s]──[confirm]──┤ commit
                                    └────────── 락이 이 구간 내내 잡혀 있음 ──────────┘
```

**개선 후** — `capture()` 는 트랜잭션이 아니고, 각 단계가 독립된 짧은 트랜잭션이다.
1단계가 커밋되며 락이 풀린 **다음에** PayPal 을 호출한다.

```java
public CaptureResponse capture(String orderId, Long guestId) {   // ← @Transactional 없음(오케스트레이터)
    Payment payment = paymentRepository.findByPaypalOrderId(orderId).orElseThrow(...);
    Reservation reservation = reservationService.findReservationById(payment.getReservationId());
    // ... 소유자/중복 capture 검증 ...

    // 1단계(짧은 트랜잭션): 락 잡고 재검증 + CAPTURING → 커밋과 함께 락 해제
    reservationService.lockAndPrepareForCapture(reservation.getId());
    paymentCaptureMarker.markCapturing(payment.getId());

    // 2단계: 락 없이 외부 호출 ✅ (PENDING 홀드가 슬롯을 선점하므로 안전)
    paypalClient.captureOrder(orderId);

    // 3단계(짧은 트랜잭션): 확정 + CAPTURED + 이벤트 (스위퍼 복구 경로와 동일 로직 재사용)
    paymentCaptureFinalizer.finalizeCapture(payment.getId());
    return new CaptureResponse(payment.getReservationId());
}
```

```
락 점유:  ├─[lock]─┤ commit   ...PayPal(락 없음)...   ├─[lock]─┤ commit
          └ ms 단위 ┘                                  └ ms 단위 ┘
```

핵심 차이는 **PayPal 호출이 락 구간 안에 있느냐**다.
다른 요청이 같은 날짜를 가져가지 못하는 건 Room 락이 아니라 **`PENDING` 홀드(`BLOCKING_STATUSES`)** 가 보장하므로,
PayPal 동안 락을 풀어도 과금/이중예약은 막힌다.

보조 변경:
- `ReservationService` 에 자기 트랜잭션 안에서 예약을 읽어 잠그는 `lockAndPrepareForCapture(Long)` 오버로드 추가.
- 3단계는 신설 `PaymentCaptureFinalizer.finalizeCapture(paymentId)` 가 담당(확정+`CAPTURED`+이벤트).
- `PaymentCaptureMarker.markRefundRequired` 추가(과금됐으나 방 확정 불가 시 `REQUIRES_NEW` 로 환불 표시 보존).

### 시나리오 A (동시 폭주) — 전/후

| 지표 | 개선 전 | 개선 후 |
|---|---|---|
| 결제 성공(capture) | 1 / 5 | **5 / 5** |
| 락 타임아웃(LOCK_TIMEOUT) | 4 | **0** |
| 신규 예약 지연(성공분) | ~4000ms | **6~18ms** |
| 전체 wall | 7047ms | **3988ms** |

```
[Contention storm] requests=10 wall=3988ms
  STORM-CAP-0   CAPTURE      PAYMENT_FAILED      start=0      took=4017
  RES-0..3      RESERVATION  SUCCESS             start=30     took=6~18
  STORM-CAP-1..5 CAPTURE     SUCCESS             start=30     took=3072~3109
  SUCCESS  n=9  p50=3072 max=3109     PAYMENT_FAILED n=1  4017
```

### 시나리오 B (순차 도착) — 전/후

| 지표 | 개선 전 | 개선 후 |
|---|---|---|
| 결제 성공 | 2 / 10 | **10 / 10** |
| 락 타임아웃 | 8 | **0** |
| 전체 wall | 10071ms | 7651ms |

```
[Sequential arrivals] requests=11 wall=7651ms
  STORM-CAP-0    CAPTURE  PAYMENT_FAILED  start=0     took=4012
  STORM-CAP-1..10 CAPTURE SUCCESS         start=28~4567 took≈3050~3090
  SUCCESS  n=10  p50=3080 max=3090     PAYMENT_FAILED n=1  4012
```

### 해석

- **락 타임아웃이 완전히 사라졌다(4→0, 8→0).** PayPal 지연이 5초를 넘겨도 더 이상 같은 방의 다른 요청을 막지 않는다.
- **결제들이 PayPal 을 병렬로 수행**한다(각 ~3초, 직렬 아님). 시나리오 A 의 5건 결제가 모두 ~3초에 끝난다.
- **신규 예약의 "락 세금"이 제거됐다**(~4000ms → 한 자릿수 ms). 멈춘 결제가 더 이상 방을 잠그지 않기 때문.
- **문제 결제(PAYMENT_FAILED)는 여전히 독립적으로 실패**하되 이웃을 끌고 들어가지 않는다(블라스트 반경 제거).
- 2단계에서 DB 커넥션도 쥐지 않으므로 Hikari 풀 고갈 위험도 함께 사라진다.

### Redis 가 필요한가? — 측정 기반 답

이 개선만으로 측정된 병목(락 타임아웃·블라스트 반경)이 사라졌다.
락 유지 시간이 ms 단위로 줄어든 지금, **분산락/락 TTL 을 위한 Redis 도입의 실익은 사실상 없다**
(오히려 TTL 락은 capture 도중 만료 시 이중 과금 위험을 만든다). Redis 는 이 문제의 해법이 아니다.

---

## 4. 종합 결론

| | 시나리오 A (동시 폭주) | 시나리오 B (순차 도착) |
|---|---|---|
| 도착 패턴 | 9건 동시 | 10건을 0.5초 간격 |
| 결제 성공/실패 | 통과 1·실패 4 (결제 기준) | 통과 2·실패 8 |
| 실패 지점 | 같은 벽시계 순간(~5s) | 각자 도착+5s (~5~6s 대역) |
| 전체 wall | 7.0s | 10.1s |

- 문제의 본질은 **외부 PayPal 호출을 Room 잠금 안에서 수행**한다는 점이다.
  PayPal 지연(≤10s) > 락 대기 한도(5s) 조합 때문에, 같은 방의 동시 결제는 대기가 아니라 **실패**로 귀결된다.
- 막힌 결제는 `REQUIRES_NEW` 마커 덕분에 **CAPTURING 상태로 남아** 스위퍼 복구 대상이 되지만,
  그 복구 경로(`reconcileOne`)도 **같은 Room 잠금**을 쓰므로 잠금이 풀릴 때까지 함께 막힌다.
- 권장 개선 방향: **PayPal 호출을 잠금 밖으로 분리**.
  잠금은 짧은 재검증 + `CAPTURING` 마킹까지만 보호하고, 외부 호출·확정은 잠금 해제 후 수행한다.

---

## 5. 재현 방법 / 산출물

```bash
./gradlew test --tests "com.airdnd.payment.PaymentLockContentionIntegrationTest"
```

- 요청별 원자료 CSV (스프레드시트/그래프용), 컬럼 `label, kind, outcome, start_ms, duration_ms`:
  - 최신 실행: `build/reports/contention-storm.csv`, `build/reports/sequential-arrivals.csv`
  - 개선 전/후 스냅샷: `docs/perf/before-*.csv`, `docs/perf/after-*.csv`
- 조절 가능한 값: 동시/순차 건수, `interArrivalMillis`(도착 간격), PayPal 지연,
  `innodb_lock_wait_timeout`(테스트 상수). 값을 바꿔 재실행하면 개선 전/후 비교 데이터셋을 만들 수 있다.

> 주의: 절대 ms 값은 스레드 스케줄링·컨테이너 부하에 따라 실행마다 소폭 달라진다.
> 성공/실패가 어느 요청에 떨어지는지도 실행마다 바뀔 수 있으나,
> **건수 분포와 ~5초 타임아웃 대역은 안정적**이다. 필요하면 3~5회 평균을 사용한다.
