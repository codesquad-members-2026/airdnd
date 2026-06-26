<div align="center">

<img src="apps/frontend/public/favicon.svg" alt="Airdnd" width="84" height="84" />

# Airdnd

**Airbnb 클론 — 숙소 등록 · 검색 · 예약 · 결제까지 이어지는 풀스택 사이드 프로젝트**

지도 기반 검색 성능을 **k6로 정량 검증해 중앙값 약 201× 개선**한, 백엔드 설계와 문제 해결 중심의 프로젝트입니다.

[![CI](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/actions/workflows/ci.yml/badge.svg)](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F)
![React](https://img.shields.io/badge/React-19-61DAFB)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1)

🔗 **Live** · [airdnd.wownd.me](https://airdnd.wownd.me) &nbsp;|&nbsp; 📖 **[프로젝트 위키](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki)** · CodeSquad Masters 2026 · Team 02

</div>

---

## 📌 한눈에 보기

| 구분 | 내용 |
|---|---|
| **백엔드** | Java 21 · Spring Boot 3.5 · Spring Security · JPA + QueryDSL |
| **데이터** | MySQL 8 · Flyway 마이그레이션 · 지오공간 인덱스 (JTS / hibernate-spatial) |
| **인증** | 자체 폼 로그인 + Google OAuth2 → **JWT (HttpOnly 쿠키, STATELESS)** |
| **결제** | Toss Payments (prepare → confirm → refund) + 결제 만료 스케줄러 |
| **외부 연동** | Toss · Kakao(지오코딩/역지오코딩) · Daum(우편번호) · Google(OAuth) |
| **API** | springdoc OpenAPI → 프론트 SDK **자동 생성** (hey-api) |
| **운영** | Docker · GitHub Actions(CI 게이트 + 수동 이미지 퍼블리시) · AWS(Cloudflare edge → private EC2 + RDS) |

> ⭐ **프로젝트 하이라이트 — 지도 검색 성능 개선:** 풀스캔(모든 bbox가 ~28초) 문제를 공간 인덱스가 동작하도록 QueryDSL 렌더링을 고쳐 해결. k6로 동일 조건 측정 결과 **중앙값 27.94s → 139ms (~201×)**, p95 47.3s → 1.34s, 실패율 0%. 자세한 내용은 [숙소 검색 성능 개선 위키](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Search-Performance) 참고.

---

## 🧱 기술 스택

### Backend
`Java 21` · `Spring Boot 3.5` · `Spring Security` · `JPA(Hibernate)` · `QueryDSL 5.1` · `MySQL 8` · `Flyway` · `JTS + hibernate-spatial` · `springdoc-openapi` · `jjwt 0.12` · `p6spy`

### Frontend
`React 19` · `TypeScript` · `Vite 5` · `TanStack Query` · `React Router 7` · `@hey-api/openapi-ts` · `Toss Payments SDK` · `framer-motion`

### Infra & Tooling
`Docker` · `GitHub Actions` · `AWS (VPC · EC2 · RDS · NAT)` · `Cloudflare` · `nginx` · `k6`

> 주요 기술 선택 이유는 [Tech-Stack 위키](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Tech-Stack)에 정리되어 있습니다.

---

## 🏗️ 아키텍처

```
   ┌─────────────┐   REST (JSON)    ┌───────────────────────────┐
   │ React (SPA) │ ──────────────▶ │   Spring Boot (Java 21)    │
   │  TS + Vite  │ ◀────────────── │  Security · JPA · QueryDSL  │
   └─────────────┘   JWT (쿠키)     └───┬───────────┬─────────┬──┘
                                        │           │         │
                                ┌───────▼──┐  ┌──────▼────┐  ┌─▼──────────────────┐
                                │ MySQL 8  │  │  외부 PG   │  │ 외부 지도 / 인증 API │
                                │ +공간인덱스│  │  (Toss)   │  │  Kakao·Daum·Google  │
                                └──────────┘  └───────────┘  └────────────────────┘
```

- **프론트/백엔드 완전 분리** — 통신은 REST(JSON), 인증은 **HttpOnly 쿠키의 JWT**로 무상태 처리
- **도메인형 패키징** — 도메인 간 결합을 낮추고 공통 관심사는 `global`로 분리
- **3계층** — Controller → Service → Repository, 복잡 조회는 QueryDSL 커스텀 리포지토리로 분리

> 배포 토폴로지(Cloudflare edge · nginx 리버스 프록시 · private subnet · NAT · RDS)는 [Infra 위키](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Infra) 참고.

---

## 📂 프로젝트 구조

모노레포 — 백엔드와 프론트엔드를 한 저장소에서 관리합니다.

```
airdnd/
├── apps/
│   ├── backend/                      # Spring Boot (Java 21, Gradle)
│   │   ├── src/main/java/codesquad/airdnd/
│   │   │   ├── domain/               # member·auth / listing / reservation
│   │   │   │                         # payment / review / wishlist
│   │   │   └── global/               # auth(jwt,security) · config
│   │   │                             # geocoding/region · response · exception
│   │   ├── src/main/resources/db/migration/   # Flyway 마이그레이션
│   │   └── Dockerfile
│   └── frontend/                     # React 19 + TS + Vite
│       ├── src/
│       ├── openapi.json              # 커밋된 API 스펙 (SDK 생성 입력)
│       ├── openapi-ts.config.ts      # hey-api 코드 생성 설정
│       ├── nginx.conf                # 정적 서빙 + /api 리버스 프록시
│       └── Dockerfile
├── .github/workflows/
│   ├── ci.yml                        # 빌드·테스트·lint 게이트
│   └── docker-publish.yml            # 수동 이미지 빌드·퍼블리시
├── docker-compose.yml                # 로컬 개발용 MySQL
└── README.md
```

> `apps/frontend/src/shared/api/generated/`(API 클라이언트), `docs/`, `seed/`, `.env` 등은 `.gitignore` 대상입니다.

---

## ✨ 핵심 기능

| 도메인 | 설명 |
|---|---|
| **인증 / 인가** | 폼 로그인 + Google OAuth2 두 경로가 동일한 JWT 발급으로 수렴 (STATELESS) |
| **숙소 · 검색** | 숙소 등록(이미지·주소·좌표), **좌표를 신뢰의 원천**으로 두는 설계, 지도 기반 공간 검색 |
| **예약** | 날짜 중복 방지, 상태머신(PENDING→CONFIRMED→COMPLETED), 결제 만료 연동 |
| **결제 · 환불** | Toss prepare→confirm→refund, 금액 서버 검증·멱등키·비관적 락·만료 스케줄러 |
| **리뷰** | 완료된 예약 한정 작성, 평점 집계 요약 |
| **위시리스트** | 찜 목록/항목 관리 + 조회 쿼리 최적화(한방 쿼리 → 분할 쿼리) |

---

## 🚀 로컬 실행

### 사전 요구사항
- JDK 21 · Node.js 20+ · Docker

### 1) 데이터베이스 (MySQL)
```bash
docker compose up -d db          # MySQL 8.0.33, :3306, DB명 airdnd_db
```

### 2) 백엔드 (Spring Boot)
```bash
cd apps/backend
./gradlew bootRun                # 실행 시 Flyway가 스키마 마이그레이션 수행
```
- 테스트: `./gradlew test` (H2 인메모리, 외부 의존 없음 — CI와 동일)
- DB 접속 정보·외부 API 키 등 시크릿은 환경변수로 주입합니다.

### 3) 프론트엔드 (Vite)
```bash
cd apps/frontend
cp .env.example .env             # 필요한 키 채우기 (Kakao / Toss 등)
npm install
npm run generate:api             # 커밋된 openapi.json → API SDK 생성
npm run dev                      # Vite dev server
```

> **API 코드 생성:** 백엔드 OpenAPI 스펙(`openapi.json`)으로 프론트 SDK를 자동 생성합니다. 생성물(`generated/`)은 커밋하지 않으며, **API를 바꾸는 PR은 `openapi.json`을 갱신**합니다. ([API-Codegen 위키](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/API-Codegen))

---

## 🔁 CI / CD

| 워크플로 | 트리거 | 내용 |
|---|---|---|
| **`ci.yml`** | `develop` push / PR | 백엔드 `./gradlew test`(차단) + 프론트 `eslint`(비차단) |
| **`docker-publish.yml`** | 수동 (`workflow_dispatch`) | 이미지 빌드 + Docker Hub push (버전 자동 증가 `v(N+1)` + `:latest`) |

- 프론트 실제 빌드(`openapi.json` → SDK 생성 → `vite build`)는 **CD 이미지 빌드 단계**에서 수행됩니다.
- EC2 배포(pull/restart)는 수동입니다. 상세는 [Infra 위키](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Infra) 참고.

---

## 📖 문서 (Wiki)

| 페이지 | 내용 |
|---|---|
| [Architecture](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Architecture) | 전체 구성과 데이터 흐름 |
| [⭐ Search-Performance](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Search-Performance) | 풀스캔 → 지오공간 인덱스, 검색 성능 ~201× 정량 검증 |
| [Auth](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Auth) | 세션 → JWT 무상태 전환, 폼+소셜 이중 경로 |
| [Listing](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Listing) | 숙소·주소·좌표 — 외부 API 3개의 신뢰 경계 설계 |
| [Payment](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Payment) | 외부 PG 연동의 멱등성·동시성·상태머신 |
| [Reservation](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Reservation) · [Review](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Review) · [Wishlist](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Wishlist) | 도메인별 설계 |
| [Database](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Database) · [API-Convention](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/API-Convention) · [API-Codegen](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/API-Codegen) | 공통 기반 |
| [Infra](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Infra) · [Troubleshooting](https://github.com/codesquad-masters2026-airdnd-team02/airdnd/wiki/Troubleshooting) | 운영 · 트러블슈팅 |

---

<div align="center">

**CodeSquad Masters 2026 · Team 02 Airdnd**

</div>
