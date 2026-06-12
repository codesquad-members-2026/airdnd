# AirDnD 백엔드

AirDnD를 위한 Spring Boot 3 API 서버입니다.

## 예정 기술 스택

- Spring Boot 3.x
- Spring Security OAuth2
- JPA
- QueryDSL
- Flyway
- 주어진 조건/실행 시점/기대 결과 구조의 BDD 스타일 테스트

## 초기 도메인

- IAM: OAuth 로그인, 세션 또는 토큰 검증, 역할 관리
- 카탈로그: 숙소 검색, 상세 조회, 호스트 숙소 관리
- 예약: 예약 가능 여부, 예약 생성, 예약 취소, 중복 예약 방지
- 관리자: 승인 및 운영 API
- 실시간/대기열: 알림, 채팅 또는 대기열 확장 기능

## 로컬 메모

백엔드 프로젝트를 생성한 뒤 최종 Java 패키지, OAuth 제공자 설정을 추가합니다.

## 데이터베이스 실행 설정

로컬 개발은 Docker MySQL과 `local` Spring profile을 사용합니다. 배포 환경은 Docker Compose에 의존하지 않고 `prod` Spring profile과 외부 환경 변수로 데이터베이스에 연결합니다.

### 로컬 개발

프로젝트 루트에서 MySQL을 실행합니다.

```bash
docker compose up -d mysql
```

백엔드는 `local` profile로 실행합니다.

```bash
./gradlew bootRun
```

`local` profile은 실행 위치에 따라 프로젝트 루트의 `.env` 또는 현재 디렉터리의 `.env`를 자동으로 읽습니다. `.env`에는 실제 값을 입력합니다.

```text
SPRING_PROFILES_ACTIVE=local
APP_FRONTEND_BASE_URL=http://127.0.0.1:5173
OAUTH2_GOOGLE_CLIENT_ID=실제-client-id.apps.googleusercontent.com
OAUTH2_GOOGLE_CLIENT_SECRET=실제-client-secret
```

IntelliJ에서 실행할 때 Run Configuration의 Environment variables에 다음과 같은 값을 넣으면 안 됩니다.

```text
OAUTH2_GOOGLE_CLIENT_ID=${OAUTH2_GOOGLE_CLIENT_ID}
OAUTH2_GOOGLE_CLIENT_SECRET=${OAUTH2_GOOGLE_CLIENT_SECRET}
```

IntelliJ는 이 값을 다른 환경 변수 참조로 확장하지 않고 문자 그대로 애플리케이션에 전달할 수 있습니다. 해당 항목을 제거하고 루트 `.env`를 사용하거나 실제 credential 값을 직접 설정한 뒤 백엔드를 재시작합니다.

Google OAuth Console의 로컬 승인된 리디렉션 URI는 다음 주소를 사용합니다.

```text
http://127.0.0.1:8080/login/oauth2/code/google
```

OAuth 주소는 Google Console 등록값과 정확히 일치해야 하므로 로컬 OAuth 테스트에서는 `127.0.0.1`과 `localhost`를 섞어 사용하지 않습니다.

로컬 기본값은 다음과 같습니다.

- host: `localhost`
- port: `3306`
- database: `airdnd`
- user: `airdnd`
- password: `airdnd`

필요하면 프로젝트 루트의 `.env.example`을 기준으로 `.env`를 만들고 값을 바꿉니다. `.env`는 git에 커밋하지 않습니다.

### 배포 환경

배포 환경에서는 MySQL을 애플리케이션 Docker Compose에 묶지 않고 별도 DB 인스턴스나 플랫폼 제공 DB를 사용합니다.

필수 환경 변수:

```bash
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:mysql://<host>:3306/<database>?useSSL=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
SPRING_DATASOURCE_USERNAME=<username>
SPRING_DATASOURCE_PASSWORD=<password>
```

선택 환경 변수:

```bash
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
```

`prod` profile의 기본 DDL 정책은 `validate`입니다. 운영 배포에서 `update`를 기본값으로 두지 않습니다.

## 데이터베이스 마이그레이션

DB 스키마 변경은 Flyway migration으로 관리합니다. JPA/Hibernate는 운영 환경에서 schema를 직접 수정하지 않고 migration 결과가 entity mapping과 맞는지 검증합니다.

마이그레이션 파일 위치:

```text
src/main/resources/db/migration
```

파일 이름 규칙:

```text
V{버전}__{설명}.sql
```

예시:

```text
V2__create_users_table.sql
V3__create_rooms_table.sql
```

현재 로컬 개발 profile은 프로젝트 초기 속도를 위해 `spring.jpa.hibernate.ddl-auto=none`을 사용합니다. 이 설정은 애플리케이션 시작 시 entity와 DB schema를 검증하지 않기 때문에, migration이 아직 없는 entity를 추가해도 서버가 바로 실패하지 않습니다.

배포 profile은 `spring.jpa.hibernate.ddl-auto=validate`를 사용합니다. 따라서 배포 전에 새 entity에 대응하는 migration SQL을 반드시 추가해야 합니다. migration이 없거나 DB schema와 entity가 다르면 배포 환경에서 애플리케이션이 시작되지 않습니다.

기능 개발이 안정화되면 로컬 profile도 `validate`로 되돌려 팀원 PC에서도 migration 누락을 빠르게 잡는 것을 권장합니다.

기존 로컬 MySQL volume에 Hibernate `update`로 만들어진 테이블이 있다면 Flyway가 실패할 수 있습니다. 개발 초기 데이터가 필요 없다면 다음 명령으로 로컬 DB를 초기화합니다.

```bash
docker compose down -v
docker compose up -d mysql
```

`down -v`는 로컬 MySQL volume을 삭제하므로 운영이나 공유 DB에서는 사용하지 않습니다.
