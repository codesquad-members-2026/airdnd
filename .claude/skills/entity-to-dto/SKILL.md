---
name: entity-to-dto
description: >-
  JPA 엔티티로부터 jakarta.validation이 적용된 요청/응답 DTO를 생성한다. 엔티티의 @Column 제약과
  필드명·도메인 의미로 검증 애너테이션을 도출하고, 매핑은 엔티티 쪽 정적 팩토리(Room.fromXxxRequest 패턴)에
  추가하며, 요청 DTO에는 검증 테스트 스캐폴드도 함께 만든다. "이 엔티티 DTO 만들어줘", "DTO 생성",
  엔티티 작성 직후 DTO가 필요할 때 사용. (Java / Spring Boot / airdnd 백엔드 전용)
---

# entity-to-dto

JPA 엔티티 → DTO(요청/응답) + 엔티티 팩토리 + 검증 테스트를 이 레포 컨벤션에 맞게 생성한다.

## 입력
- **엔티티 파일 경로 또는 클래스명** (예: `apps/backend/src/main/java/com/airdnd/room/Room.java`)
- **DTO 종류**: `Create` / `Update(PATCH)` / `Response` 중 무엇인지. 인자로 안 주면 `AskUserQuestion`으로 묻는다(복수 선택 가능 — 한 번에 여러 종류 생성 가능).

## 절차

### 1. 엔티티 분석
대상 엔티티를 읽고 각 필드에서 다음을 추출한다:
- 타입 (String / Integer·Long / BigDecimal / Boolean / enum / 컬렉션 / 연관관계)
- `@Column(nullable, length, precision, scale)`, `@Enumerated`, `@Id`/`@GeneratedValue`
- **서버 결정 필드** 식별: `id`, `*Id`(host_id 등 인증/연관으로 주입), `isActive`, `isDeleted`, 생성/수정 시각 등 → 요청 DTO에서 **제외**, 응답에서도 내부 플래그는 노출 금지.

### 2. DTO 종류별 규칙
- **Create 요청**: 서버 결정 필드 제외. `nullable=false` 필드는 필수 검증. 누락=거부.
- **Update(PATCH) 요청**: 모든 필드 **nullable**(전송된 것만 수정). 값이 들어오면 Create와 **동일 범위**로만 검증(`@NotNull`/`@NotBlank`는 붙이지 않음). 클래스 상단에 의도 주석:
  `// 부분 수정(PATCH)이라 필드는 null 허용. 값이 들어오면 생성 시와 동일 범위로 검증한다.`
- **응답 DTO**: **검증 애너테이션 없음**. 노출 필드만 선별. `from(Entity, ...)` 정적 팩토리 + 필요 시 `fromList(...)`.

### 3. 제약 → 애너테이션 매핑 (결정적)
| 엔티티 단서 | 애너테이션 |
|---|---|
| `nullable=false`, String | `@NotBlank` |
| `nullable=false`, 그 외 | `@NotNull` |
| `@Column(length=N)`, String | `@Size(max = N)` |
| `BigDecimal precision=p, scale=s` | `@Digits(integer = p - s, fraction = s)` |
| 금액·수량 정수(Integer/Long) | `@Min(1)` (+ 도메인 상한 `@Max`) |
| enum | 타입 그대로 + (필수면) `@NotNull` |
| 컬렉션(필수) | `@NotEmpty`; 원소 객체 검증은 `@Valid` |
| 중첩 객체 | `@Valid` 전파 |

### 4. 의미 기반 추론 (타입만으론 부족 — 필드명/도메인으로)
- `email` → `@Email`
- `*Url`/`imageUrl` → URL 형식(`@Pattern` 또는 `@org.hibernate.validator.constraints.URL`)
- `countryCode` → `@Pattern(regexp = "^[A-Z]{2}$")`
- `latitude` → `@DecimalMin("-90.0")` `@DecimalMax("90.0")`, `longitude` → `±180.0`
- 날짜: 과거/미래 의미면 `@Past`/`@Future`
- **범위·상한이 도메인 지식이라 불확실하면 추측하지 말고 `AskUserQuestion`으로 확인**(예: 가격 상한, 인원 상한).

### 5. 교차 필드 검증
단일 필드 애너테이션으로 안 되는 규칙은 DTO 본문에 `@AssertTrue` 메서드로. (이 레포 예: bbox 4좌표 all-or-none, `south<=north`, `checkIn<checkOut`)
```java
@AssertTrue(message = "체크아웃은 체크인보다 뒤여야 합니다.")
public boolean hasValidDateRange() {
    return checkIn == null || checkOut == null || checkIn.isBefore(checkOut);
}
```

### 6. 매핑은 "엔티티 팩토리"에 추가 (DTO에 toEntity() 만들지 않는다)
- **Create 요청**: 대상 **엔티티에** 정적 팩토리를 추가/갱신한다 — `Room.fromRoomRequest(...)` 패턴.
  서버 주입 값(hostId, hostName 등)은 팩토리 인자로 받고, 엔티티 내부에서 `isActive=true`, `isDeleted=false` 같은 기본값을 세팅한다.
- **응답 DTO**: 매핑은 DTO 쪽 `from(Entity, ...)` 정적 팩토리에 둔다(검증 없음).
- DTO에는 양방향 변환 로직을 넣지 않는다(읽기 단순화).

### 7. 코드 컨벤션
- **요청/응답 DTO는 `record` 우선**(기존 `RoomUpdateRequest`, `RoomSearchRequestDto` 스타일). 단, 기존 클래스를 확장/일관성 유지해야 하면 Lombok 클래스(`HostRoomRequest`) 패턴을 따른다.
- 패키지: 엔티티와 같은 도메인의 `dto` 하위(예: `com.airdnd.room.dto`).
- `import jakarta.validation.constraints.*;`
- **모든 메시지는 한국어**, 기존 톤 유지(예: "가격은 필수입니다.", "위도는 -90 이상이어야 합니다.").

### 8. 검증 테스트 스캐폴드 (요청 DTO마다 생성)
`src/test/.../dto/<DtoName>ValidationTest.java`. 행복 경로 1개 + 위반 경로 1개 이상.

- **record DTO**(불변): 정규 생성자로 인스턴스를 만든다. `ReflectionTestUtils.setField` 사용 금지(record 필드는 final).
```java
class XxxRequestValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test void acceptsValid() { assertThat(validator.validate(valid())).isEmpty(); }

    @Test void rejectsOutOfRange() {
        XxxRequest invalid = new XxxRequest(/* valid 값들… 단 price=0, lat=90.0001 */);
        assertThat(validator.validate(invalid))
            .extracting(v -> v.getPropertyPath().toString())
            .contains("pricePerNight", "latitude");
    }

    private XxxRequest valid() { return new XxxRequest(/* 전부 유효 */); }
}
```
- **Lombok 클래스 DTO**(가변): 기존 `HostRoomRequestValidationTest` 패턴(`ReflectionTestUtils.setField`로 valid 객체를 만들고 일부만 invalid로 덮어쓰기)을 그대로 따른다.

### 9. 마무리
- 생성/수정한 파일 목록과 각 DTO 종류를 한 줄씩 요약.
- 컴파일 확인이 가능하면 `./gradlew compileJava compileTestJava -q` 제안.
- 의미 제약을 추론으로 채운 곳은 "추론값"이라고 명시해 사용자가 검토하게 한다.

## 좋은 예시 (이 레포 기준)
- 요청+검증(클래스): `apps/backend/src/main/java/com/airdnd/room/dto/HostRoomRequest.java`
- PATCH(record, nullable): `.../dto/RoomUpdateRequest.java`
- 교차검증(record, @AssertTrue): `.../dto/RoomSearchRequestDto.java`
- 응답(record, from/fromList): `.../dto/RoomResponse.java`
- 엔티티 팩토리: `Room.fromRoomRequest(...)` in `.../room/Room.java`
- 검증 테스트: `apps/backend/src/test/java/com/airdnd/room/dto/HostRoomRequestValidationTest.java`
