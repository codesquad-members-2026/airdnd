# AirDnD 프론트엔드

AirDnD의 React/Vite 프론트엔드입니다. 백엔드가 없어도 MSW mock API로 주요 화면과 사용자 흐름을 확인할 수 있도록 구성했습니다.

## 기술 스택

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Zustand 준비
- MSW
- Vitest
- Playwright
- plain CSS

## 실행 환경

- Node.js 20 LTS 이상 권장
- npm 사용 기준

## 설치

```bash
cd apps/frontend
npm install
```

## 개발 서버 실행

```bash
npm run dev
```

기본 주소:

```text
http://127.0.0.1:5173
```

Vite 개발 서버는 OAuth 세션과 CORS origin을 일치시키기 위해 `127.0.0.1`에만 바인딩합니다. 브라우저에서도 `http://localhost:5173` 대신 위 주소로 접속합니다.

## 환경 변수

`.env.example`을 참고합니다.

```text
VITE_API_BASE_URL=http://127.0.0.1:8080
VITE_OAUTH_BASE_URL=http://127.0.0.1:8080
VITE_ENABLE_MOCKS=false
```

- `VITE_ENABLE_MOCKS=true`: 브라우저에서 공개 API 중심의 MSW mock API 사용. mock 로그인은 제공하지 않습니다.
- `VITE_ENABLE_MOCKS=false`: 실제 백엔드 API와 Google OAuth 사용
- `VITE_OAUTH_BASE_URL`: Google OAuth 시작 요청을 보내는 백엔드 주소
- 실제 OAuth 테스트에서는 Google Console에 등록한 `127.0.0.1` 주소와 일치하도록 `localhost`를 섞어 사용하지 않습니다.
- 로컬 프론트엔드, 백엔드, Google OAuth redirect URI는 모두 `127.0.0.1` 호스트를 사용합니다.

## 라우트

- `/`: 숙소 목록 및 검색
- `/rooms/map`: 지도 기반 숙소 탐색
- `/rooms/:roomId`: 숙소 상세 및 예약
- `/login`: Google OAuth 진입
- `/auth/callback`: OAuth 세션 확인 후 로그인 전 경로로 복귀
- `/reservations`: 내 예약 목록 및 취소
- `/reservations/:reservationId`: 예약 확인 상세
- `/my`: 마이페이지
- `/notifications`: 알림 목록
- `/host/rooms`: 호스트 숙소 관리
- `/host/rooms/new`: 호스트 숙소 등록
- `/host/rooms/:roomId/edit`: 호스트 숙소 수정
- `/admin`: 관리자 대시보드
- `/admin/rooms/pending`: 관리자 숙소 승인
- `/admin/users`: 사용자 관리
- `/admin/reservations`: 예약 현황 대시보드
- `/admin/waitlist`: 대기 시스템 상태

## 인증 및 역할별 화면

- 비로그인 사용자는 공개 숙소와 지도 메뉴만 볼 수 있습니다.
- `GUEST`는 예약, 마이페이지, 알림 화면에 접근할 수 있습니다.
- `HOST`는 `GUEST` 기능과 호스트 숙소 관리 화면에 접근할 수 있습니다.
- `ADMIN`은 모든 사용자 기능과 관리자 화면에 접근할 수 있습니다.
- 프론트엔드는 역할에 맞지 않는 메뉴를 숨기고 보호 라우트 접근을 차단합니다.
- 실제 권한 보안은 반드시 백엔드 Spring Security 규칙으로 최종 검증합니다.
- 역할별 UI 조건은 `src/features/auth/lib/authAccess.ts`를 기준으로 확장합니다.

## 디렉터리 구조

```text
src/
  app/              앱 부트스트랩, provider, router
  features/         auth, rooms, reservations, host, admin 도메인 코드
  mocks/            MSW handler와 fixture
  pages/            URL 단위 화면
  shared/           공통 API client, UI, util, config
  styles/           전역 스타일
```

## API 계약

프론트엔드가 기대하는 API는 다음 문서를 기준으로 합니다.

- `docs/api/openapi.yaml`
- `docs/api/frontend-api-spec.md`

백엔드 API가 바뀌면 API 문서, `src/features/*/api`, mock handler를 함께 갱신합니다.

## 검증 명령

```bash
npm run lint
npm run test
npm run build
npm run e2e
```

## 수동 확인 시나리오

1. `/`에서 숙소 목록이 보이는지 확인합니다.
2. 검색 조건을 변경했을 때 목록 요청이 다시 실행되는지 확인합니다.
3. 숙소 카드를 클릭해 `/rooms/:roomId`로 이동합니다.
4. 비로그인 상태에서 예약 버튼이 로그인 유도로 보이는지 확인합니다.
5. `/login`의 Google 로그인 링크가 백엔드 OAuth 시작 URL을 가리키는지 확인합니다.
6. Google 로그인 후 회원 정보가 DB에 저장되는지 확인합니다.
7. 로그인 세션으로 숙소 상세에서 예약을 생성하고 `/reservations`에서 확인합니다.
8. 예약을 취소하고 목록 상태가 갱신되는지 확인합니다.
9. 호스트 권한 계정으로 `/host/rooms`와 숙소 등록 폼을 확인합니다.
10. 관리자 권한 계정으로 `/admin` 지표를 확인합니다.
