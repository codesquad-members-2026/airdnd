# AirDnD 도메인별 필수 기능 목록

이 문서는 `apps/backend/docs/ERD.txt`, 루트 요구사항 문서, 현재 프론트엔드 API 명세를 기준으로 백엔드에서 구현해야 할 기능을 도메인별로 정리한 실행 목록입니다.

채팅은 현재 프론트엔드 범위에서 제외된 상태이므로 이 문서의 필수 목록에서는 제외합니다. 다만 알림은 추가 예정 요구사항으로 보고 별도 도메인으로 포함합니다.

## 우선순위 기준

- `P0`: 게스트 예약 흐름을 끝까지 연결하기 위해 반드시 필요한 기능
- `P1`: 호스트, 관리자, 운영 흐름을 위해 필요한 핵심 기능
- `P2`: 서비스 완성도, 확장성, 운영 편의성을 높이는 기능

## ERD 기준 도메인 매핑

| 도메인 | ERD 테이블 | 주요 책임 |
| --- | --- | --- |
| 회원/IAM | `members` | OAuth 로그인, 현재 사용자, 역할, 탈퇴 |
| 숙소/카탈로그 | `rooms`, `room_images` | 숙소 검색, 상세 조회, 이미지, 호스트 숙소 관리 |
| 예약 | `reservations` | 예약 생성, 중복 방지, 가격 계산, 취소 |
| 리뷰 | `reviews` | 예약 기반 리뷰 작성, 평점, 삭제 |
| 위시리스트 | `wishlists`, `wishlist_rooms` | 찜 폴더, 숙소 저장/해제 |
| 알림 | ERD에 아직 없음 | 예약/호스트/시스템 이벤트 알림 |
| 관리자/운영 | 기존 테이블 전체 | 사용자/숙소/예약 운영, 승인, 대기열 |

## 공통 정책

### 공통 엔티티 규칙

- 모든 주요 조회는 soft delete 데이터를 제외해야 합니다.
- `members.is_deleted = true`인 사용자는 로그인, 예약 생성, 호스트 관리, 관리자 기능을 사용할 수 없어야 합니다.
- `rooms.is_deleted = true`인 숙소는 게스트 검색과 상세 조회에서 제외해야 합니다.
- `rooms.is_active = false`인 숙소는 게스트에게 노출하지 않고, 호스트 본인과 관리자만 볼 수 있어야 합니다.
- 예약은 `deleted_at`이 있는 데이터를 기본 조회에서 제외하되, 관리자 감사 목적 조회는 별도 정책으로 허용할 수 있습니다.
- 날짜는 API에서 `YYYY-MM-DD`, 시간은 ISO-8601 또는 DB timestamp 기준으로 통일합니다.
- 금액은 원화 정수로 처리합니다.
- API 오류 응답은 `{ code, message, details? }` 형식으로 통일합니다.

### 권한 규칙

- 비로그인 사용자는 숙소 검색/상세 조회만 가능합니다.
- `GUEST`는 예약, 예약 조회/취소, 리뷰, 위시리스트, 알림 조회가 가능합니다.
- `HOST`는 게스트 기능에 더해 본인 숙소 등록/수정/비활성화가 가능합니다.
- `ADMIN`은 전체 운영 API에 접근할 수 있습니다.
- 호스트는 본인이 소유한 숙소만 수정할 수 있어야 합니다.
- 게스트는 본인 예약만 조회/취소할 수 있어야 합니다.

## 1. 회원/IAM 도메인

### 구현 대상

- `P0` OAuth 로그인 시작
  - GitHub 또는 Google OAuth2 로그인 엔드포인트를 제공합니다.
  - OAuth provider에서 받은 사용자 식별자를 `oauth_provider`, `oauth_id`로 저장합니다.
  - 같은 `oauth_provider + oauth_id` 조합으로 재로그인하면 기존 회원을 재사용합니다.
  - `email`은 unique이므로 provider가 달라도 같은 이메일 충돌 정책을 정해야 합니다.

- `P0` 로그인 성공 후 회원 생성/조회
  - 최초 로그인 시 `members` row를 생성합니다.
  - 기본 role은 `GUEST`로 시작하는 것이 안전합니다.
  - 팀 정책에 따라 특정 계정을 `HOST` 또는 `ADMIN`으로 승격하는 관리자 기능을 둡니다.
  - 회원가입 직후 기본 위시리스트 폴더 `"가고 싶은 곳"`을 자동 생성합니다.

- `P0` 현재 사용자 조회
  - `GET /api/auth/me`
  - 로그인 상태면 id, email, nickname, role을 반환합니다.
  - 비로그인 상태면 현재 프론트 명세처럼 `null` 또는 401 중 하나로 통일해야 합니다.

- `P0` 로그아웃
  - `POST /api/auth/logout`
  - 세션 쿠키 기반이면 서버 세션을 무효화합니다.
  - 성공 시 `204 No Content`를 반환합니다.

- `P1` 역할 관리
  - `GUEST`, `HOST`, `ADMIN` 역할을 지원합니다.
  - 관리자만 사용자 role 변경이 가능해야 합니다.
  - role 변경은 감사 로그 또는 최소한 updated timestamp가 필요합니다.

- `P1` 회원 탈퇴/비활성화
  - `members.is_deleted = true`로 soft delete 처리합니다.
  - 탈퇴 회원의 진행 중 예약, 등록 숙소 처리 정책을 정의해야 합니다.
  - 탈퇴 회원은 로그인 성공 후에도 서비스 접근을 막아야 합니다.

### 검증해야 할 비즈니스 규칙

- 중복 OAuth 계정 생성 방지
- 탈퇴 회원 로그인 차단
- 비로그인 사용자의 보호 API 접근 차단
- role별 접근 제어

## 2. 숙소/카탈로그 도메인

### 게스트 숙소 검색

- `P0` 숙소 목록 검색
  - `GET /api/rooms`
  - `is_active = true`, `is_deleted = false` 숙소만 반환합니다.
  - 대표 이미지가 있으면 함께 반환합니다.
  - 최소 응답 필드: id, name, address 또는 region, pricePerNight, maxGuests, rating, reviewCount, imageUrl, allowsPets.

- `P0` 지역/주소 검색
  - `region` 또는 검색어가 들어오면 `rooms.address` 기준 부분 검색을 수행합니다.
  - ERD에는 별도 region 컬럼이 없으므로 API 응답에서 region이 필요하면 address에서 파생하거나 `rooms.region` 추가를 검토해야 합니다.

- `P0` 인원 필터
  - `adults + children` 값을 숙소 수용 인원으로 판단합니다.
  - `rooms.max_capacity >= adults + children` 조건을 적용합니다.
  - 유아는 별도 정책입니다. `rooms.allows_infants = false`인 경우 `infants > 0` 검색에서 제외해야 합니다.

- `P0` 반려동물 필터
  - 검색 조건 `allowsPets=true`이면 `rooms.allows_pets = true` 숙소만 반환합니다.
  - 예약 요청의 `hasPets=true`도 동일하게 검증해야 합니다.

- `P0` 가격 범위 필터
  - `minPrice`, `maxPrice`를 `rooms.price_per_night`에 적용합니다.
  - 음수 가격, min > max 요청은 400 오류로 처리합니다.

- `P1` 날짜 기반 예약 가능 여부 검색
  - `checkIn`, `checkOut`이 있으면 해당 기간에 확정 예약이 없는 숙소만 반환합니다.
  - 겹침 조건: 기존 예약의 `check_in_date < 요청 checkOut` 그리고 `check_out_date > 요청 checkIn`.
  - `CONFIRMED` 또는 정책상 `PENDING` 예약까지 점유로 볼지 결정해야 합니다.

- `P1` 좌표/반경 검색
  - ERD에 `latitude`, `longitude`가 있으므로 지도 검색과 반경 검색을 구현할 수 있습니다.
  - `lat`, `lng`, `radiusKm` 파라미터를 받을 수 있습니다.
  - QueryDSL 또는 DB native function을 사용할지 결정해야 합니다.

- `P1` 정렬/페이지네이션
  - 기본 정렬: 최신 등록 또는 추천순.
  - 옵션: 가격 낮은순/높은순, 평점순, 리뷰 많은순, 거리순.
  - 목록 API는 페이지네이션을 지원해야 운영 데이터 증가에 대응할 수 있습니다.

### 숙소 상세

- `P0` 숙소 상세 조회
  - `GET /api/rooms/{roomId}`
  - 활성/삭제되지 않은 숙소만 게스트에게 노출합니다.
  - 상세 설명, 주소, 국가 코드, 좌표, 이미지 목록, 가격, 수용 인원, 유아/반려동물 허용 여부를 반환합니다.
  - 리뷰 요약과 최근 리뷰 일부를 포함할지 별도 endpoint로 분리할지 결정합니다.

- `P1` 이미지 처리
  - `room_images`는 숙소별 1:N입니다.
  - 대표 이미지는 숙소당 하나만 허용해야 합니다.
  - 대표 이미지가 없으면 첫 번째 이미지 또는 기본 이미지를 반환하는 정책이 필요합니다.

### 호스트 숙소 관리

- `P1` 호스트 숙소 목록 조회
  - `GET /api/host/rooms`
  - 현재 로그인한 호스트의 숙소만 반환합니다.
  - 활성/비활성/삭제 여부를 관리 화면에서 볼 수 있어야 합니다.

- `P1` 숙소 등록
  - `POST /api/host/rooms`
  - 필수 입력: name, address, countryCode, latitude, longitude, pricePerNight, maxCapacity.
  - 선택 입력: description, allowsInfants, allowsPets, images.
  - pricePerNight > 0, maxCapacity >= 1을 검증합니다.
  - 좌표는 지도 검색 기준이므로 누락되면 등록 실패로 처리합니다.

- `P1` 숙소 수정
  - `PUT /api/host/rooms/{roomId}`
  - 호스트 본인 숙소만 수정 가능합니다.
  - 예약이 이미 있는 숙소의 가격/수용 인원 변경이 기존 예약에 영향을 주지 않도록 예약에는 `total_price`를 확정 저장합니다.

- `P1` 숙소 비활성화
  - `PATCH /api/host/rooms/{roomId}/status` 또는 별도 inactive endpoint.
  - `is_active=false`이면 게스트 검색에서 제외합니다.
  - 기존 예약이 있는 숙소를 비활성화해도 예약 내역은 유지합니다.

- `P2` 숙소 삭제
  - `is_deleted=true` soft delete를 적용합니다.
  - 진행 중 예약이 있으면 삭제를 제한하거나 비활성화만 허용합니다.

### ERD/API 보완 필요

- 현재 ERD에는 관리자 승인 상태가 없습니다.
  - 관리자 숙소 승인 기능을 구현하려면 `rooms.status` 또는 `approval_status`가 필요합니다.
  - 예: `PENDING_APPROVAL`, `ACTIVE`, `REJECTED`, `INACTIVE`.
- 현재 ERD에는 편의시설 테이블이 없습니다.
  - 프론트 상세/등록 화면에는 amenities가 있으므로 `amenities`, `room_amenities` 추가를 검토해야 합니다.
- 현재 ERD에는 `created_at`, `updated_at`이 `rooms`에 없습니다.
  - 정렬과 운영 관리에 필요하므로 추가하는 것이 좋습니다.

## 3. 예약 도메인

### 예약 생성

- `P0` 예약 생성 API
  - `POST /api/reservations`
  - 로그인 필요.
  - 요청 필드: roomId, checkIn, checkOut, adults, children, infants, hasPets.
  - 기존 프론트 명세의 `guests`는 `adults + children`으로 대체하거나 하위 호환 필드로만 사용합니다.

- `P0` 날짜 검증
  - checkIn < checkOut이어야 합니다.
  - checkIn은 오늘 이전 날짜일 수 없습니다.
  - 최소/최대 숙박일 정책을 정할 수 있습니다.

- `P0` 수용 인원 검증
  - `adult_count >= 1`.
  - `adult_count + child_count <= rooms.max_capacity`.
  - 현재 프론트 필터는 성인/아동/유아 각각 최대 8명입니다. 백엔드도 동일 제한을 적용해야 합니다.
  - `infant_count > 0`이면 `rooms.allows_infants = true`여야 합니다.
  - `has_pets = true`이면 `rooms.allows_pets = true`여야 합니다.

- `P0` 중복 예약 방지
  - 같은 roomId에 대해 기간이 겹치는 `CONFIRMED` 예약이 있으면 생성 실패.
  - 동시 요청을 막기 위해 트랜잭션 잠금, DB 제약, 또는 예약 가능 기간 테이블 전략을 사용해야 합니다.
  - 단순 조회 후 insert만 하면 동시 예약에서 race condition이 발생할 수 있습니다.

- `P0` 가격 계산
  - 숙박일 수 = checkOut - checkIn.
  - totalPrice = rooms.price_per_night * 숙박일 수.
  - 추후 청소비, 서비스 수수료, 할인, 쿠폰이 생기면 별도 가격 정책 컴포넌트로 분리합니다.
  - 예약 생성 시점의 금액을 `reservations.total_price`에 저장해 숙소 가격 변경 영향을 막습니다.

- `P0` 예약 상태
  - 최소 상태: `PENDING`, `CONFIRMED`, `CANCELED`.
  - 결제 기능이 없으면 생성 즉시 `CONFIRMED`로 두는 단순 정책도 가능합니다.
  - 결제 도입 예정이면 `PENDING` 생성 후 결제 성공 시 `CONFIRMED`로 전환합니다.

### 예약 조회/취소

- `P0` 내 예약 목록
  - `GET /api/reservations`
  - 현재 로그인한 사용자의 예약만 반환합니다.
  - 예약 상태, 숙소 이름, 대표 이미지, 체크인/체크아웃, 인원, 총액을 포함합니다.

- `P0` 예약 상세
  - `GET /api/reservations/{reservationId}`
  - 본인 예약만 조회 가능합니다.
  - 호스트는 본인 숙소의 예약을 볼 수 있는 별도 API가 필요할 수 있습니다.

- `P0` 예약 취소
  - `DELETE /api/reservations/{reservationId}` 또는 `PATCH status=CANCELED`.
  - 본인 예약만 취소 가능합니다.
  - 이미 취소된 예약은 idempotent하게 204를 줄지, 409를 줄지 결정합니다.
  - 체크인 당일/이후 취소 가능 여부 정책을 정해야 합니다.

- `P1` 호스트 예약 조회
  - 호스트가 본인 숙소의 예약 목록을 조회할 수 있어야 운영이 가능합니다.
  - 기간, 상태, 숙소별 필터를 지원합니다.

### 예약 이벤트

- 예약 생성 성공: 게스트에게 예약 확정/접수 알림, 호스트에게 새 예약 알림.
- 예약 취소: 게스트와 호스트에게 취소 알림.
- 예약 상태 변경: 관련 사용자에게 상태 변경 알림.

## 4. 리뷰 도메인

### 구현 대상

- `P1` 리뷰 작성
  - `POST /api/reservations/{reservationId}/reviews` 또는 `POST /api/reviews`.
  - 예약과 1:1 관계입니다.
  - 본인의 예약에 대해서만 작성 가능합니다.
  - 예약 상태가 `CONFIRMED`이고 체크아웃 이후인 경우만 작성 가능하게 하는 것이 일반적입니다.
  - rating은 1~5 범위입니다.

- `P1` 리뷰 조회
  - 숙소 상세에서 리뷰 목록을 조회합니다.
  - 페이지네이션이 필요합니다.
  - 삭제된 리뷰는 제외합니다.

- `P1` 리뷰 수정/삭제
  - 작성자 본인만 수정/삭제 가능합니다.
  - 삭제는 `deleted_at` soft delete를 적용합니다.

- `P1` 평점 집계
  - 숙소 카드에 rating, reviewCount가 필요합니다.
  - 매번 집계 쿼리를 실행할지, rooms에 summary 컬럼을 둘지 결정해야 합니다.

### 검증해야 할 규칙

- 예약 1건당 리뷰 1개만 허용.
- 실제 숙박하지 않은 사용자의 리뷰 작성 금지.
- rating 범위 검증.
- 삭제 리뷰 집계 제외.

## 5. 위시리스트 도메인

### 구현 대상

- `P1` 기본 위시리스트 자동 생성
  - 회원 최초 생성 시 `"가고 싶은 곳"` 폴더를 생성합니다.
  - ERD 주석에 명시된 전략입니다.

- `P1` 내 위시리스트 폴더 목록
  - `GET /api/wishlists`
  - 최신 생성순 또는 이름순 정렬을 지원합니다.

- `P1` 위시리스트 폴더 생성/수정/삭제
  - `POST /api/wishlists`
  - `PATCH /api/wishlists/{wishlistId}`
  - `DELETE /api/wishlists/{wishlistId}`
  - 같은 회원 안에서 폴더명 중복 허용 여부를 결정합니다.

- `P1` 숙소 찜 추가/해제
  - `POST /api/wishlists/{wishlistId}/rooms/{roomId}`
  - `DELETE /api/wishlists/{wishlistId}/rooms/{roomId}`
  - 같은 폴더에 같은 숙소가 중복 추가되지 않도록 unique 제약이 필요합니다.

- `P1` 폴더별 숙소 목록
  - `GET /api/wishlists/{wishlistId}/rooms`
  - 삭제/비활성 숙소 표시 정책을 정해야 합니다.

### ERD 보완 필요

- `wishlist_rooms`에 `(wishlist_id, room_id)` unique 제약이 필요합니다.
- `wishlists`에 `updated_at`, soft delete가 필요한지 결정해야 합니다.

## 6. 알림 도메인

현재 ERD에는 알림 테이블이 없습니다. 하지만 요구사항과 현재 프론트엔드 API 명세에는 알림 목록이 있으므로 신규 도메인으로 설계해야 합니다.

### 추천 테이블

```text
notifications
- id bigint pk
- member_id bigint not null ref members.id
- type varchar(30) not null
- title varchar(255) not null
- message varchar(1000) not null
- link_url varchar(500)
- read_at timestamp null
- created_at timestamp default current_timestamp
- deleted_at timestamp null
```

필요 시 실시간 전송 이력을 분리합니다.

```text
notification_deliveries
- id bigint pk
- notification_id bigint ref notifications.id
- channel varchar(20)  // IN_APP, SSE, EMAIL
- status varchar(20)   // PENDING, SENT, FAILED
- sent_at timestamp
- failure_reason varchar(500)
```

### 알림 API

- `P1` 알림 목록
  - `GET /api/notifications`
  - 현재 로그인한 사용자의 알림만 반환합니다.
  - 최신순 정렬, 페이지네이션을 지원합니다.

- `P1` 읽지 않은 알림 수
  - `GET /api/notifications/unread-count`
  - 헤더 배지 또는 알림 아이콘에 사용합니다.

- `P1` 알림 읽음 처리
  - `PATCH /api/notifications/{notificationId}/read`
  - 본인 알림만 처리 가능합니다.

- `P1` 전체 읽음 처리
  - `PATCH /api/notifications/read-all`
  - 현재 사용자 알림 전체를 읽음 처리합니다.

- `P2` 알림 삭제
  - `DELETE /api/notifications/{notificationId}`
  - soft delete 권장.

- `P2` 실시간 알림
  - 초기 구현은 polling으로 충분합니다.
  - 확장 구현은 SSE를 추천합니다. 채팅처럼 양방향이 필요하지 않으므로 WebSocket보다 단순합니다.

### 알림 발생 이벤트

- `P0/P1` 예약 생성
  - 게스트: 예약이 생성/확정되었다는 알림.
  - 호스트: 새 예약이 들어왔다는 알림.

- `P1` 예약 취소
  - 게스트: 예약 취소 완료 알림.
  - 호스트: 예약 취소 알림.

- `P1` 숙소 승인/반려
  - 호스트: 등록한 숙소가 승인 또는 반려되었다는 알림.

- `P1` 리뷰 작성
  - 호스트: 숙소에 새 리뷰가 작성되었다는 알림.

- `P2` 시스템/운영 알림
  - 대기열 상태 변경.
  - 서비스 점검.
  - 정책 변경.

### 구현 주의사항

- 알림 생성은 핵심 트랜잭션 성공 이후에 수행해야 합니다.
- 알림 생성 실패가 예약 생성 자체를 실패시키지 않도록 이벤트 기반 또는 after commit 처리를 고려합니다.
- 알림 타입 enum은 프론트 표시와 연결되므로 API 문서에 고정해야 합니다.

## 7. 관리자/운영 도메인

### 관리자 대시보드

- `P1` 대시보드 지표
  - `GET /api/admin/dashboard`
  - 승인 대기 숙소 수.
  - 활성 사용자 수.
  - 오늘 예약 수.
  - 대기열 크기.
  - 추후 매출, 취소율, 리뷰 평균 등을 추가할 수 있습니다.

### 숙소 승인 관리

- `P1` 승인 대기 숙소 목록
  - `GET /api/admin/rooms/pending`
  - ERD에 승인 상태가 없으므로 상태 컬럼 추가가 선행되어야 합니다.

- `P1` 숙소 승인
  - `POST /api/admin/rooms/{roomId}/approve`
  - 승인되면 게스트 검색에 노출됩니다.
  - 호스트에게 승인 알림을 생성합니다.

- `P1` 숙소 반려
  - `POST /api/admin/rooms/{roomId}/reject`
  - 반려 사유를 저장하려면 별도 컬럼 또는 이력 테이블이 필요합니다.
  - 호스트에게 반려 알림을 생성합니다.

### 사용자 관리

- `P1` 사용자 목록
  - `GET /api/admin/users`
  - role, 가입일, 예약 수, 상태를 반환합니다.

- `P1` 사용자 상태 변경
  - 회원 정지, 탈퇴 처리, role 변경 기능이 필요할 수 있습니다.
  - 사용자 제재 기능을 만들려면 `members.status` 또는 `suspended_until` 같은 컬럼이 필요합니다.

### 예약 현황 관리

- `P1` 전체 예약 목록
  - `GET /api/admin/reservations`
  - 기간, 상태, 숙소, 게스트, 호스트 기준 필터를 지원합니다.

- `P1` 예약 상태별 집계
  - confirmed, canceled, pending 수.
  - 오늘/이번 주/이번 달 기준 조회.

### 대기 시스템

- `P2` 대기열 상태 조회
  - `GET /api/admin/waitlist`
  - 현재 프론트엔드는 대기열 상태 화면을 가지고 있습니다.
  - 실제 대기열 구현 전에는 운영 mock 또는 메모리 기반 상태로 시작할 수 있습니다.

- `P2` 트래픽 집중 대응
  - 입장 대기, 토큰 발급, 입장 허용률 제어.
  - Redis 또는 외부 큐 도입을 검토합니다.

## 8. 지도/외부 API 도메인

- `P1` 지도 기반 숙소 탐색
  - `rooms.latitude`, `rooms.longitude`를 사용해 지도 마커를 제공합니다.
  - bounding box 또는 반경 검색 API가 필요합니다.

- `P1` 주소-좌표 변환
  - 숙소 등록 시 주소를 좌표로 변환하는 기능이 필요합니다.
  - Google Maps 등 외부 API를 사용할 경우 실패/쿼터/비용 대응이 필요합니다.

- `P2` 이미지 업로드
  - 현재 ERD는 image_url만 저장합니다.
  - S3 업로드를 도입하면 presigned URL 발급 API가 필요합니다.

## 9. API/문서 도메인

- `P0` OpenAPI 문서 최신화
  - 실제 백엔드 구현과 `docs/api/openapi.yaml`을 맞춥니다.
  - 예약 요청에는 adults, children, infants, hasPets를 반영해야 합니다.

- `P0` 프론트 API 명세 최신화
  - `docs/api/frontend-api-spec.md`를 백엔드 구현에 맞춰 업데이트합니다.

- `P0` 공통 오류 코드
  - `UNAUTHENTICATED`
  - `FORBIDDEN`
  - `VALIDATION_FAILED`
  - `ROOM_NOT_FOUND`
  - `RESERVATION_NOT_FOUND`
  - `TOO_MANY_GUESTS`
  - `INFANTS_NOT_ALLOWED`
  - `PETS_NOT_ALLOWED`
  - `ALREADY_BOOKED`
  - `INVALID_DATE_RANGE`

- `P1` 페이지네이션 표준
  - 목록 API는 `page`, `size`, `sort`를 통일합니다.
  - 응답은 `items`, `page`, `size`, `totalElements`, `totalPages` 같은 구조로 통일할 수 있습니다.

## 10. 테스트 도메인

### P0 테스트

- OAuth 로그인 후 회원 생성/조회.
- 비로그인 사용자의 예약 생성 차단.
- 숙소 검색 필터: 지역, 가격, 인원, 반려동물.
- 숙소 상세 조회.
- 예약 생성 성공.
- 예약 날짜 중복 방지.
- 수용 인원 초과 실패.
- 유아/반려동물 허용 정책 실패.
- 예약 목록/상세 조회 권한.
- 예약 취소.

### P1 테스트

- 호스트 본인 숙소 등록/수정/비활성화.
- 다른 호스트 숙소 수정 차단.
- 관리자 숙소 승인/반려.
- 리뷰 작성/중복 작성 차단.
- 위시리스트 기본 폴더 생성.
- 위시리스트 숙소 중복 추가 방지.
- 알림 생성/조회/읽음 처리.

### P2 테스트

- 지도 반경 검색.
- 대기열 입장 제어.
- 알림 SSE 연결.
- 관리자 통계 집계.

## 구현 로드맵 제안

### 1단계: 예약 흐름 완성 `P0`

1. 회원/IAM 기본 로그인.
2. 숙소 검색/상세.
3. 예약 생성/조회/취소.
4. 예약 중복 방지.
5. 공통 오류/검증.

### 2단계: 호스트 기능 `P1`

1. 호스트 숙소 목록.
2. 숙소 등록/수정/비활성화.
3. 이미지 관리.
4. 예약 현황 조회.

### 3단계: 관리자와 알림 `P1`

1. 관리자 대시보드.
2. 숙소 승인/반려.
3. 사용자/예약 운영 조회.
4. 알림 테이블 추가.
5. 예약/숙소 승인 이벤트 기반 알림 생성.
6. 알림 목록/읽음 API.

### 4단계: 리뷰/위시리스트/지도 `P1-P2`

1. 리뷰 작성/조회/수정/삭제.
2. 평점/리뷰 수 집계.
3. 위시리스트 폴더와 찜.
4. 지도 반경 검색.

### 5단계: 운영 확장 `P2`

1. 대기열.
2. SSE 실시간 알림.
3. 모니터링/부하 테스트.
4. 배포 자동화와 HTTPS.

## 현재 ERD 기준으로 먼저 결정해야 할 항목

- 관리자 승인 기능을 위해 `rooms.status`를 추가할지, `is_active`만으로 처리할지.
- 프론트가 사용하는 amenities를 ERD에 추가할지.
- 알림 테이블을 어떤 최소 구조로 추가할지.
- 예약 상태에서 `PENDING`을 실제로 사용할지, 결제 전까지는 `CONFIRMED`만 쓸지.
- `members.email` unique와 OAuth provider별 계정 충돌을 어떻게 처리할지.
- `region`을 address 파생값으로 둘지, 별도 컬럼으로 둘지.
- 날짜 중복 예약 방지를 DB 레벨에서 어떻게 보강할지.
- 목록 API 페이지네이션 응답 구조를 지금 도입할지.
