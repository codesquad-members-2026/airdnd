# AirDnD 디렉터리 가이드

이 문서는 현재 모노레포 구조에서 각 디렉터리의 역할, 넣어야 하는 파일 종류, 권장 확장자를 정리합니다. 새 파일을 추가할 때 “어디에 둬야 하는지”를 판단하는 기준으로 사용합니다.

## 전체 원칙

- `apps/backend`에는 백엔드 애플리케이션 코드와 백엔드 전용 문서를 둡니다.
- `apps/frontend`에는 프론트엔드 애플리케이션 코드와 프론트엔드 디자인 자료를 둡니다.
- `docs`에는 프론트엔드와 백엔드가 함께 참고해야 하는 공통 문서를 둡니다.
- `infra`에는 배포, 서버, 네트워크, 클라우드, 컨테이너 관련 설정을 둡니다.
- `scripts`에는 반복 작업을 자동화하는 로컬 실행 스크립트를 둡니다.
- 루트에는 저장소 전체에 적용되는 설정 파일만 둡니다.
- 임시 파일, IDE 개인 설정, 운영 비밀값, 빌드 결과물은 커밋하지 않습니다.

## 루트 디렉터리

저장소 전체를 설명하거나 모든 앱에 공통으로 적용되는 파일을 둡니다.

권장 파일:

- `README.md`: 프로젝트 개요, 실행 방법, 주요 링크
- `.gitignore`: Git에 포함하지 않을 파일 목록
- `.gitattributes`: 줄바꿈, 텍스트/바이너리 처리 규칙
- `.gitmessage`: 커밋 메시지 템플릿
- `요구사항.md`, `프론트요구사항.txt`, `백엔드요구사항.txt`: 원본 요구사항 자료

권장 확장자:

- `.md`: 사람이 읽는 문서
- `.txt`: 원본 요구사항, 간단한 메모
- `.yml`, `.yaml`: 저장소 전체 설정이 필요할 때
- `.json`: 저장소 전체 도구 설정이 필요할 때

두지 않는 파일:

- `.env`, `.env.local` 같은 비밀값 파일
- `node_modules`, `build`, `dist` 같은 생성 결과물
- `.DS_Store`, 개인 IDE 설정
- 백엔드 또는 프론트엔드 한쪽에만 필요한 소스 코드

## `.github`

GitHub에서 사용하는 협업 템플릿과 자동화 설정을 둡니다.

현재 역할:

- PR 템플릿
- 이슈 템플릿
- 향후 GitHub Actions 워크플로

권장 파일:

- `.github/PULL_REQUEST_TEMPLATE.md`: PR 작성 양식
- `.github/ISSUE_TEMPLATE/*.md`: 이슈 종류별 작성 양식
- `.github/ISSUE_TEMPLATE/config.yml`: 이슈 템플릿 설정
- `.github/workflows/*.yml`: CI/CD 자동화 설정. 아직 없지만, 추후 추가 위치는 여기입니다.

권장 확장자:

- `.md`: PR/이슈 템플릿
- `.yml`, `.yaml`: GitHub 설정, GitHub Actions 워크플로

주의:

- `labels`, `assignees`, `name`, `about` 같은 YAML 키는 GitHub가 읽는 값이므로 임의로 구조를 바꾸지 않습니다.
- 배포 키, OAuth secret, AWS secret은 GitHub Secrets에 등록하고 파일로 커밋하지 않습니다.

## `apps`

실제 실행되는 애플리케이션을 모아 두는 최상위 디렉터리입니다.

현재 하위 디렉터리:

- `apps/backend`: 백엔드 애플리케이션
- `apps/frontend`: 프론트엔드 애플리케이션

권장 파일:

- 앱 자체 파일은 각 하위 디렉터리에 둡니다.
- `apps` 바로 아래에는 공통 앱 설정이 명확히 필요할 때만 파일을 둡니다.

두지 않는 파일:

- 백엔드와 프론트엔드 중 한쪽에만 필요한 코드
- 빌드 결과물
- 임시 파일

## `apps/backend`

Spring Boot 3 기반 백엔드 API 서버를 위한 디렉터리입니다.

역할:

- REST API 구현
- 인증/인가 구현
- 도메인 모델과 비즈니스 로직 구현
- DB 연동, JPA, QueryDSL 설정
- 백엔드 테스트
- 백엔드 전용 Docker 설정

향후 권장 파일:

- `build.gradle` 또는 `build.gradle.kts`: Gradle 빌드 설정
- `settings.gradle` 또는 `settings.gradle.kts`: Gradle 프로젝트 설정
- `gradlew`, `gradlew.bat`, `gradle/wrapper/*`: Gradle Wrapper
- `Dockerfile`: 백엔드 애플리케이션 이미지 빌드 설정
- `.env.example`: 백엔드 실행에 필요한 환경 변수 예시
- `README.md`: 백엔드 실행 방법과 설정 설명

권장 확장자:

- `.java`: 백엔드 소스 코드
- `.yml`, `.yaml`: Spring 설정 파일
- `.properties`: Spring 설정 파일을 properties 방식으로 사용할 때
- `.sql`: 초기 데이터, 마이그레이션 SQL, 테스트 SQL
- `.gradle`, `.kts`: Gradle 설정
- `.md`: 백엔드 문서

두지 않는 파일:

- 실제 DB 비밀번호, OAuth secret, AWS key가 들어간 설정 파일
- 프론트엔드 컴포넌트나 화면 코드
- 빌드 결과물인 `build/`, `out/`, `.class`

## `apps/backend/src/main/java`

백엔드 운영 코드가 들어가는 위치입니다.

권장 내용:

- Controller: HTTP 요청/응답 처리
- Service: 비즈니스 로직
- Repository: DB 접근
- Entity: JPA 엔티티
- DTO: 요청/응답 데이터 구조
- Config: Security, QueryDSL, CORS 등 설정
- Exception: 예외 타입과 전역 예외 처리

권장 확장자:

- `.java`

예상 패키지 구성 예시:

```text
com/airdnd/
  auth/
  user/
  room/
  reservation/
  host/
  admin/
  notification/
  common/
```

주의:

- 아직 최종 Java 패키지명이 정해지지 않았으므로, 백엔드 프로젝트 생성 시 팀에서 패키지명을 먼저 합의합니다.
- 도메인별로 코드를 나눌지, 계층별로 나눌지는 팀 컨벤션을 먼저 정합니다.

## `apps/backend/src/main/resources`

백엔드 실행에 필요한 리소스와 설정 파일을 둡니다.

권장 파일:

- `application.yml`: 공통 Spring 설정
- `application-local.yml`: 로컬 개발 설정
- `application-test.yml`: 테스트 설정
- `application-prod.yml`: 운영 환경 설정의 구조 예시
- `static/*`: 백엔드가 직접 제공해야 하는 정적 파일이 있을 때
- `templates/*`: 서버 사이드 템플릿을 사용할 때

권장 확장자:

- `.yml`, `.yaml`
- `.properties`
- `.sql`
- `.json`

주의:

- 실제 비밀번호나 secret은 파일에 직접 쓰지 않고 환경 변수로 주입합니다.
- 운영 설정 파일에는 구조만 남기고 민감 정보는 제외합니다.

## `apps/backend/src/test/java`

백엔드 테스트 코드를 둡니다.

권장 내용:

- 단위 테스트
- 슬라이스 테스트
- 통합 테스트
- 인증/인가 테스트
- 예약 중복 방지 같은 핵심 비즈니스 규칙 테스트

권장 확장자:

- `.java`

작성 기준:

- 가능한 경우 주어진 조건/실행 시점/기대 결과 구조로 작성합니다.
- API 동작은 Controller 테스트 또는 통합 테스트로 검증합니다.
- 예약, 결제, 권한처럼 장애 영향이 큰 기능은 테스트 우선순위를 높입니다.

## `apps/backend/docs`

백엔드에만 관련된 문서를 둡니다.

권장 파일:

- API 구현 메모
- 백엔드 설계 메모
- 인증 흐름 설명
- QueryDSL 쿼리 설계 메모
- 백엔드 트러블슈팅 기록

권장 확장자:

- `.md`
- `.txt`
- `.png`, `.jpg`, `.svg`: 백엔드 전용 다이어그램 이미지

공통 API 명세나 ERD는 루트의 `docs/api`, `docs/erd`에 둡니다.

## `apps/backend/docker`

백엔드 전용 Docker 관련 파일을 둡니다.

권장 파일:

- 백엔드 개발용 Dockerfile 초안
- 백엔드 컨테이너 실행 예시
- 백엔드 서버만 띄우는 Compose 조각

권장 확장자:

- `Dockerfile`
- `.yml`, `.yaml`
- `.md`

주의:

- 전체 시스템을 함께 띄우는 Docker Compose 파일은 `infra/docker`에 두는 것이 좋습니다.
- 이미지 빌드 결과물이나 컨테이너 볼륨 데이터는 커밋하지 않습니다.

## `apps/frontend`

React/Vite 기반 프론트엔드 클라이언트를 위한 디렉터리입니다.

역할:

- 화면 구현
- 라우팅
- API 호출
- 로그인 상태 관리
- mock data 관리
- 디자인 자료 관리

향후 권장 파일:

- `package.json`: 프론트엔드 의존성과 스크립트
- `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`: 사용하는 패키지 매니저의 lock 파일
- `vite.config.js`: Vite 설정
- `index.html`: Vite 진입 HTML
- `.env.example`: 프론트엔드 환경 변수 예시
- `README.md`: 프론트엔드 실행 방법과 구조 설명

권장 확장자:

- `.js`, `.jsx`: React와 JavaScript 코드
- `.css`: 스타일
- `.json`: mock data, 설정
- `.svg`, `.png`, `.jpg`, `.webp`: 이미지 자료
- `.md`: 문서

두지 않는 파일:

- 실제 API key가 들어간 `.env`
- `node_modules/`
- `dist/`
- 백엔드 Java 코드

## `apps/frontend/public`

빌드 도구가 그대로 정적 파일로 복사해 제공해야 하는 파일을 둡니다.

권장 파일:

- `favicon.ico`
- `robots.txt`
- 정적 이미지 중 URL이 고정되어야 하는 파일
- 외부에서 직접 접근해야 하는 mock 파일이 있을 때

권장 확장자:

- `.ico`
- `.txt`
- `.png`, `.jpg`, `.webp`, `.svg`
- `.json`

주의:

- React 컴포넌트에서 import해서 쓰는 이미지는 보통 `src/assets`에 둡니다.
- `public`에 둔 파일은 코드 번들링 최적화 대상이 아닐 수 있습니다.

## `apps/frontend/src`

프론트엔드 운영 코드의 루트입니다.

향후 권장 파일:

- `main.jsx`: React 앱 진입점
- `App.jsx`: 앱 최상위 컴포넌트
- `router.jsx` 또는 `routes/index.js`: 라우팅 설정

권장 확장자:

- `.js`
- `.jsx`
- `.css`
- `.json`

## `apps/frontend/src/api`

백엔드 API 호출 코드를 둡니다.

권장 파일:

- `client.js`: 공통 fetch wrapper, base URL, 공통 헤더 처리
- `rooms.js`: 숙소 목록/상세/검색 API
- `reservations.js`: 예약 생성/조회/취소 API
- `auth.js`: 로그인 상태, 사용자 정보, 로그아웃 API
- `host.js`: 호스트 숙소 등록/수정/비활성화 API
- `admin.js`: 관리자 API

권장 확장자:

- `.js`

작성 기준:

- 화면 컴포넌트 안에 fetch URL을 직접 흩뿌리지 않습니다.
- `VITE_API_BASE_URL`을 사용해 API 서버 주소를 관리합니다.
- 401과 403은 구분해서 처리합니다.
- POST, PUT, DELETE 뒤에는 관련 데이터를 다시 가져오는 흐름을 고려합니다.

## `apps/frontend/src/assets`

프론트엔드 코드에서 import해서 사용하는 이미지와 정적 자료를 둡니다.

권장 내용:

- 아이콘
- 로고
- 화면에서 사용하는 이미지
- CSS에서 참조하는 이미지

권장 확장자:

- `.svg`
- `.png`
- `.jpg`, `.jpeg`
- `.webp`
- `.css`에서 참조할 폰트 파일이 필요하면 `.woff`, `.woff2`

주의:

- Figma 원본 참고용 대용량 SVG는 `design/SVG`에 유지합니다.
- 실제 앱에서 사용하는 최적화된 파일만 `src/assets`로 옮깁니다.

## `apps/frontend/src/components`

여러 화면에서 재사용하거나, 화면을 구성하는 작은 UI 컴포넌트를 둡니다.

권장 예시:

- `Header.jsx`
- `RoomCard.jsx`
- `RoomList.jsx`
- `SearchBar.jsx`
- `ReservationForm.jsx`
- `ReservationList.jsx`
- `LoginButton.jsx`
- `Loading.jsx`
- `ErrorMessage.jsx`

권장 확장자:

- `.jsx`
- `.js`
- `.css`

작성 기준:

- 컴포넌트 이름은 역할이 드러나게 작성합니다.
- 한 화면에서만 쓰이고 아직 재사용성이 낮은 코드는 `pages` 안에 두어도 됩니다.
- 같은 UI가 두 번 이상 반복되면 `components`로 분리하는 것을 고려합니다.

## `apps/frontend/src/contexts`

React Context API 기반 전역 상태를 둡니다.

권장 파일:

- `AuthContext.jsx`: 로그인 사용자 정보, 로그인 여부, 로그아웃 처리
- `ToastContext.jsx`: 전역 알림이 필요할 때

권장 확장자:

- `.jsx`
- `.js`

주의:

- 모든 상태를 전역으로 올리지 않습니다.
- 특정 화면에서만 쓰는 상태는 해당 페이지나 컴포넌트 내부에 둡니다.

## `apps/frontend/src/mocks`

백엔드 API가 준비되기 전 사용하는 mock data를 둡니다.

권장 파일:

- `rooms.js` 또는 `rooms.json`
- `reservations.js` 또는 `reservations.json`
- `users.js` 또는 `users.json`

권장 확장자:

- `.js`
- `.json`

작성 기준:

- 실제 API 응답 형태와 최대한 비슷하게 작성합니다.
- API 명세가 바뀌면 mock data도 함께 갱신합니다.
- mock data는 개발 보조용이며 실제 운영 데이터가 아닙니다.

## `apps/frontend/src/pages`

URL 단위로 연결되는 화면 컴포넌트를 둡니다.

권장 예시:

- `HomePage.jsx`: 메인 숙소 목록
- `RoomDetailPage.jsx`: 숙소 상세
- `LoginPage.jsx`: 로그인
- `ReservationsPage.jsx`: 예약 목록
- `MyPage.jsx`: 마이페이지
- `HostRoomsPage.jsx`: 호스트 숙소 관리
- `HostRoomFormPage.jsx`: 숙소 등록/수정
- `AdminPage.jsx`: 관리자 화면

권장 확장자:

- `.jsx`
- `.js`
- `.css`

작성 기준:

- 페이지 컴포넌트는 라우팅, API 호출, 화면 상태 조합을 담당합니다.
- 반복 UI는 `components`로 분리합니다.
- 페이지 안에 너무 많은 비즈니스 로직이 쌓이면 별도 hook 또는 api 함수로 분리합니다.

## `apps/frontend/src/routes`

React Router 설정을 둡니다.

권장 파일:

- `index.jsx`
- `routes.jsx`
- `ProtectedRoute.jsx`: 로그인 필요 화면 보호
- `HostRoute.jsx`: 호스트 권한 필요 화면 보호
- `AdminRoute.jsx`: 관리자 권한 필요 화면 보호

권장 확장자:

- `.jsx`
- `.js`

주의:

- 로그인 필요, 권한 없음 처리를 라우팅에서 일관되게 관리합니다.
- 401과 403 흐름은 백엔드 인증 방식과 맞춰 조정합니다.

## `apps/frontend/src/styles`

전역 스타일, CSS 변수, 공통 스타일 파일을 둡니다.

권장 파일:

- `global.css`: 전역 리셋, 기본 폰트, body 스타일
- `variables.css`: 색상, 간격, z-index 등 디자인 토큰
- `layout.css`: 공통 레이아웃 규칙

권장 확장자:

- `.css`

주의:

- 특정 컴포넌트에만 필요한 스타일은 컴포넌트 근처에 두는 방식도 가능합니다.
- 스타일 방식은 plain CSS, CSS Modules, styled-components, Tailwind CSS 중 팀이 선택합니다.
- 선택한 방식은 프론트엔드 README에 기록합니다.

## `apps/frontend/design`

프론트엔드 디자인 참고 자료를 둡니다.

현재 구조:

- `apps/frontend/design/SVG/plan`: 기획 자료 페이지
- `apps/frontend/design/SVG/detail`: 상세 UI 참고 자료

권장 파일:

- Figma에서 export한 참고 이미지
- 구현 전 확인용 디자인 시안
- 컬러, 아이콘, 모달, 화면 구조 참고 자료

권장 확장자:

- `.svg`
- `.png`
- `.jpg`
- `.pdf`

주의:

- 이 디렉터리는 참고 자료 보관용입니다.
- 실제 앱에서 import해서 쓰는 최적화된 에셋은 `src/assets`에 둡니다.
- 대용량 디자인 파일은 필요한 것만 커밋하고, 원본 관리는 별도 도구를 사용하는 것이 좋습니다.

## `docs`

프론트엔드와 백엔드가 함께 보는 공통 문서를 둡니다.

현재 하위 디렉터리:

- `docs/api`
- `docs/architecture`
- `docs/decisions`
- `docs/erd`
- `docs/learning`
- `docs/qa`

권장 확장자:

- `.md`: 기본 문서
- `.txt`: 간단한 원본 메모
- `.json`, `.yml`, `.yaml`: API 예시나 설정 예시
- `.png`, `.jpg`, `.svg`: 다이어그램 이미지
- `.drawio`: diagrams.net 원본 파일을 사용할 때

## `docs/api`

프론트엔드와 백엔드가 합의한 API 계약을 둡니다.

권장 파일:

- API 목록
- 요청/응답 예시
- 오류 응답 형식
- 인증 방식
- 페이지네이션 규칙
- 검색 파라미터 규칙

권장 확장자:

- `.md`
- `.json`
- `.yml`, `.yaml`

작성 기준:

- API가 바뀌면 프론트엔드 코드와 함께 문서를 갱신합니다.
- 401, 403, 404, 409 같은 주요 오류 응답을 명확히 적습니다.

## `docs/architecture`

시스템 구조와 설계 설명을 둡니다.

권장 파일:

- 전체 아키텍처 설명
- 배포 구조
- 인증 흐름
- 예약 생성 흐름
- 대기열 구조
- 실시간 알림 또는 채팅 구조

권장 확장자:

- `.md`
- `.png`, `.jpg`, `.svg`
- `.drawio`

## `docs/decisions`

팀의 중요한 기술적 의사결정을 기록합니다.

권장 파일:

- ADR 문서
- 기술 선택 이유
- 논의 결과
- 나중에 되돌아봐야 할 결정 사항

권장 확장자:

- `.md`

파일명 예시:

```text
0001-use-spring-security-oauth.md
0002-use-react-router.md
0003-reservation-concurrency-strategy.md
```

작성 기준:

- 문제, 선택지, 결정, 이유, 결과를 간단히 남깁니다.
- 결정이 바뀌면 기존 문서를 지우기보다 새 문서로 변경 이유를 남깁니다.

## `docs/erd`

ERD와 데이터 모델 문서를 둡니다.

권장 파일:

- ERD 이미지
- ERD 원본 파일
- 테이블 설명
- 주요 인덱스 전략
- soft delete 정책
- surrogate key 정책

권장 확장자:

- `.md`
- `.png`, `.jpg`, `.svg`
- `.drawio`
- `.sql`

주의:

- README에 최종 ERD 링크나 이미지를 포함해야 합니다.
- 테이블 변경이 생기면 ERD와 API 문서를 함께 확인합니다.

## `docs/learning`

팀 학습 기록과 AI Agent 사용 기록을 둡니다.

권장 파일:

- 학습 회고
- AI Agent에게 요청한 작업과 검증 결과
- 새로 배운 문법이나 개념 정리
- 문제 해결 과정 기록

권장 확장자:

- `.md`
- `.txt`

작성 기준:

- 단순히 결과만 적지 말고, 왜 그렇게 했는지와 팀원이 이해한 내용을 남깁니다.
- AI가 만든 코드는 팀원이 설명할 수 있는 수준으로 검토한 뒤 기록합니다.

## `docs/qa`

수동 테스트 시나리오와 검증 기록을 둡니다.

권장 파일:

- 숙소 목록 조회 시나리오
- 숙소 상세 조회 시나리오
- 로그인 시나리오
- 예약 생성 시나리오
- 예약 목록 조회 시나리오
- 예약 취소 시나리오
- 호스트 숙소 등록 시나리오
- 배포 후 점검표

권장 확장자:

- `.md`
- `.txt`
- `.csv`: 테스트 케이스 표가 필요할 때

작성 기준:

- 테스트 일자, 실행 환경, 기대 결과, 실제 결과를 남깁니다.
- 실패한 테스트는 관련 이슈와 연결합니다.

## `infra`

배포와 운영 인프라 관련 파일을 둡니다.

현재 하위 디렉터리:

- `infra/aws`
- `infra/docker`
- `infra/nginx`

권장 확장자:

- `.md`
- `.yml`, `.yaml`
- `.conf`
- `.tf`: Terraform을 도입할 경우
- `.sh`: 서버 설정 스크립트가 필요할 경우

주의:

- AWS access key, secret key, 인증서 private key는 커밋하지 않습니다.
- 운영 서버의 실제 비밀값은 Secret Manager, GitHub Secrets, 서버 환경 변수로 관리합니다.

## `infra/aws`

AWS 리소스와 배포 구조 문서를 둡니다.

권장 내용:

- EC2 구성
- RDS 구성
- S3 사용 계획
- ELB 적용 계획
- CodeDeploy 적용 계획
- 보안 그룹 규칙 설명
- 운영 환경 변수 목록

권장 확장자:

- `.md`
- `.yml`, `.yaml`
- `.tf`

## `infra/docker`

프론트엔드, 백엔드, DB 등 여러 구성 요소를 함께 실행하는 Docker 설정을 둡니다.

권장 파일:

- `docker-compose.yml`
- `docker-compose.local.yml`
- 공통 네트워크/볼륨 설명 문서

권장 확장자:

- `.yml`, `.yaml`
- `.md`

구분 기준:

- 백엔드 앱 하나만 빌드하는 Dockerfile은 `apps/backend` 또는 `apps/backend/docker`
- 전체 시스템을 함께 띄우는 Compose 파일은 `infra/docker`

## `infra/nginx`

Nginx 리버스 프록시와 HTTPS 설정을 둡니다.

권장 파일:

- `default.conf`
- `airdnd.conf`
- HTTPS 적용 절차 문서
- 프론트엔드 정적 파일 서빙 설정
- 백엔드 API 프록시 설정

권장 확장자:

- `.conf`
- `.md`

주의:

- 인증서 파일, private key 파일은 커밋하지 않습니다.
- 도메인과 포트 정보가 실제 운영값이면 공개 가능 여부를 확인합니다.

## `scripts`

반복 작업을 자동화하는 로컬 스크립트를 둡니다.

권장 예시:

- 개발 환경 점검 스크립트
- 백엔드/프론트엔드 동시 실행 스크립트
- 테스트 실행 스크립트
- 배포 전 검증 스크립트

권장 확장자:

- `.sh`
- `.js`
- `.md`: 스크립트 사용 설명

주의:

- 스크립트는 실행 전에 어떤 작업을 하는지 파일 상단이나 문서에 명확히 적습니다.
- 로컬 파일 삭제, DB 초기화, 배포 같은 위험한 작업은 실행 전에 확인 절차를 둡니다.

## `.gitkeep` 파일

현재 여러 빈 디렉터리에는 `.gitkeep` 파일이 있습니다.

역할:

- Git은 빈 디렉터리를 추적하지 않으므로, 디렉터리 구조를 유지하기 위해 넣은 placeholder 파일입니다.

운영 기준:

- 해당 디렉터리에 실제 파일이 추가되면 `.gitkeep`은 삭제해도 됩니다.
- `.gitkeep` 자체에는 기능이 없습니다.

## 커밋하지 말아야 할 파일

다음 파일은 원칙적으로 커밋하지 않습니다.

- `.env`, `.env.local`, `.env.production`
- 실제 secret이 포함된 설정 파일
- `.DS_Store`
- `.idea/`, `.vscode/` 같은 개인 IDE 설정
- `node_modules/`
- `dist/`, `build/`, `out/`
- `.gradle/`
- 로그 파일
- 서버 인증서 private key
- DB dump 파일 중 개인정보나 민감 정보가 포함된 파일

필요하면 예시 파일만 커밋합니다.

예시:

- `.env.example`
- `application-local.example.yml`
- `docker-compose.example.yml`

## 새 파일 위치 판단 기준

새 파일을 추가할 때는 다음 순서로 판단합니다.

1. 백엔드 실행 코드인가? 그러면 `apps/backend/src/main/java`입니다.
2. 백엔드 설정인가? 그러면 `apps/backend/src/main/resources`입니다.
3. 백엔드 테스트인가? 그러면 `apps/backend/src/test/java`입니다.
4. 프론트엔드 화면 코드인가? 그러면 `apps/frontend/src/pages` 또는 `apps/frontend/src/components`입니다.
5. 프론트엔드 API 호출 코드인가? 그러면 `apps/frontend/src/api`입니다.
6. 프론트엔드 mock data인가? 그러면 `apps/frontend/src/mocks`입니다.
7. 앱에서 import하는 이미지인가? 그러면 `apps/frontend/src/assets`입니다.
8. 디자인 참고 자료인가? 그러면 `apps/frontend/design`입니다.
9. 공통 API/ERD/설계 문서인가? 그러면 `docs` 아래 적절한 하위 디렉터리입니다.
10. 배포, AWS, Docker, Nginx 설정인가? 그러면 `infra`입니다.
11. 로컬 자동화 스크립트인가? 그러면 `scripts`입니다.
12. GitHub 협업 템플릿이나 CI 설정인가? 그러면 `.github`입니다.

애매하면 “이 파일을 가장 자주 읽고 수정할 사람이 누구인가”를 기준으로 둡니다. 백엔드 팀이 주로 관리하면 백엔드 쪽, 프론트엔드 팀이 주로 관리하면 프론트엔드 쪽, 양쪽이 함께 보면 `docs` 또는 `infra`에 둡니다.
