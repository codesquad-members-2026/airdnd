# 프론트엔드 API 명세

이 문서는 현재 프론트엔드가 기대하는 백엔드 API 계약을 설명합니다. 상세 스키마는 `docs/api/openapi.yaml`을 기준으로 합니다.

## 공통 규칙

- 기본 URL은 `VITE_API_BASE_URL` 환경 변수로 주입합니다.
- OAuth 시작 URL의 백엔드 주소는 `VITE_OAUTH_BASE_URL` 환경 변수로 주입합니다.
- 로컬 OAuth 테스트 기본 URL은 `http://127.0.0.1:8080`이며 Google Console 등록 주소와 호스트를 일치시킵니다.
- 인증은 우선 세션 쿠키 기반을 가정하고 `credentials: include`로 요청합니다.
- 날짜는 `YYYY-MM-DD` 형식을 사용합니다.
- 금액은 원화 정수 값으로 주고받습니다.
- 인원 수는 1 이상의 정수입니다.
- 오류 응답은 백엔드 공통 응답 형식인 `{ "code": string, "message": string, "detail"?: object }` 형식을 사용합니다.

## 인증

### 현재 사용자 조회

`GET /api/auth/me`

- 로그인 상태면 `User`를 반환합니다.
- 비로그인 상태면 `null`을 반환합니다.

### OAuth 로그인 시작

`GET /oauth2/authorization/google`

- 백엔드는 OAuth provider로 리다이렉트합니다.
- 로그인 성공 후 프론트엔드의 `/auth/callback`으로 돌아옵니다.
- 프론트엔드는 `/api/auth/me`를 다시 조회하고 인증된 사용자를 로그인 전 내부 경로로 이동시킵니다.
- 현재 구현 provider는 Google이며 GitHub는 추후 등록 및 별도 사용자 정보 매핑이 필요합니다.

### 로그아웃

`POST /api/auth/logout`

- 성공 시 `204 No Content`를 반환합니다.
- 프론트엔드는 인증 상태와 사용자별 캐시를 제거하고 공개 홈으로 이동합니다.

### 역할별 프론트엔드 접근

- `GUEST`: 예약, 마이페이지, 알림
- `HOST`: `GUEST` 기능과 호스트 숙소 관리
- `ADMIN`: 모든 사용자 기능과 관리자 기능
- 역할에 맞지 않는 메뉴는 렌더링하지 않으며 직접 URL 접근은 `/forbidden`으로 이동합니다.
- 프론트엔드 접근 제어는 사용성 보조이며, 실제 권한은 백엔드가 각 API에서 검증해야 합니다.

## 숙소

### 숙소 목록 검색

`GET /api/rooms?region=서울&checkIn=2026-07-10&checkOut=2026-07-12&guests=2`

응답은 `RoomSummary[]`입니다.

검색 파라미터:

- `region`: 지역 또는 주소 검색어
- `checkIn`: 체크인 날짜
- `checkOut`: 체크아웃 날짜
- `adults`: 성인 수
- `children`: 아동 수
- `infants`: 유아 수
- `guests`: 숙소 수용 인원 필터용 합산 값. 기본은 `adults + children`입니다.
- `minPrice`: 1박 최소 가격
- `maxPrice`: 1박 최대 가격
- `allowsPets`: `true`이면 반려동물 동반 가능 숙소만 조회합니다.

프론트엔드는 다음 상태를 처리합니다.

- 로딩
- 데이터 없음
- 오류
- 성공

### 숙소 상세 조회

`GET /api/rooms/{roomId}`

응답은 `RoomDetail`입니다.

## 예약

### 내 예약 목록

`GET /api/reservations`

- 로그인 필요
- 응답은 `Reservation[]`입니다.

### 예약 상세 조회

`GET /api/reservations/{reservationId}`

- 로그인 필요
- 예약 확인 화면에서 사용합니다.

### 예약 생성

`POST /api/reservations`

요청:

```json
{
  "roomId": 101,
  "checkIn": "2026-07-10",
  "checkOut": "2026-07-12",
  "guests": 2
}
```

주요 오류:

- `401 UNAUTHENTICATED`: 로그인 필요
- `409 TOO_MANY_GUESTS`: 최대 인원 초과
- `409 ALREADY_BOOKED`: 이미 예약된 날짜

### 예약 취소

`DELETE /api/reservations/{reservationId}`

- 성공 시 `204 No Content`
- 취소 후 프론트엔드는 예약 목록을 다시 가져옵니다.

## 호스트

### 호스트 숙소 목록

`GET /api/host/rooms`

- 로그인 필요
- `HOST` 또는 `ADMIN` 권한 필요

### 호스트 숙소 등록

`POST /api/host/rooms`

요청:

```json
{
  "name": "성수 루프탑 스테이",
  "region": "서울",
  "address": "서울특별시 성동구 성수동",
  "description": "숙소 설명",
  "pricePerNight": 145000,
  "maxGuests": 4,
  "imageUrl": "https://example.com/room.jpg",
  "imageUrls": ["https://example.com/room-2.jpg", "https://example.com/room-3.jpg"],
  "allowsPets": false,
  "amenities": ["와이파이", "주방"]
}
```

### 호스트 숙소 수정

`PUT /api/host/rooms/{roomId}`

등록과 같은 요청 형식을 사용합니다.

### 호스트 숙소 상태 변경

`PATCH /api/host/rooms/{roomId}/status`

요청:

```json
{
  "status": "INACTIVE"
}
```

가능한 상태:

- `ACTIVE`
- `INACTIVE`
- `PENDING_APPROVAL`

## 관리자

### 관리자 대시보드

`GET /api/admin/dashboard`

- 로그인 필요
- `ADMIN` 권한 필요
- 승인 대기 숙소, 활성 사용자, 오늘 예약 수, 대기열 크기를 반환합니다.

### 관리자 숙소 승인 목록

`GET /api/admin/rooms/pending`

- `ADMIN` 권한 필요
- 승인 대기 상태의 호스트 숙소 목록을 반환합니다.

### 관리자 숙소 승인/반려

`POST /api/admin/rooms/{roomId}/approve`

`POST /api/admin/rooms/{roomId}/reject`

### 사용자 관리

`GET /api/admin/users`

- 사용자 역할, 가입일, 예약 수, 상태를 반환합니다.

### 예약 현황 대시보드

`GET /api/admin/reservations`

- 전체 예약 목록과 상태별 집계를 위한 데이터를 반환합니다.

### 대기 시스템 상태

`GET /api/admin/waitlist`

- 대기열 상태, 대기 사용자 수, 평균 대기 시간, 분당 입장 수를 반환합니다.

## 알림

### 알림 목록

`GET /api/notifications`

- 로그인 필요
- 예약, 호스트, 시스템 알림 목록을 반환합니다.

## 프론트엔드 mock API

현재 프론트엔드는 공개 숙소 API와 일부 화면 개발을 위해 MSW를 사용할 수 있습니다.

- mock 사용: `VITE_ENABLE_MOCKS=true`
- 실제 백엔드 및 Google OAuth 사용: `VITE_ENABLE_MOCKS=false`

mock 로그인 기능은 제거되었습니다. 인증이 필요한 기능은 실제 백엔드 OAuth 세션으로 확인합니다.
