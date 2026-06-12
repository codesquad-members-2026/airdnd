# AirDnD 프로젝트 브리프

## 확인한 요구사항 자료

- `README.md`
- `요구사항.md`
- `프론트요구사항.txt`
- `백엔드요구사항.txt`
- `apps/frontend/design/SVG/**`

## 요약

AirDnD는 숙소 예약 서비스입니다. 구현은 게스트 예약 흐름을 끝까지 완성하는 것을 우선하고, 그다음 호스트 숙소 관리, 관리자 또는 확장 기능 순서로 진행합니다.

## 백엔드 우선순위

- Spring Boot 3.x API 서버
- 영속성과 동적 검색을 위한 JPA 및 QueryDSL
- GitHub 또는 Google OAuth 기반 Spring Security
- `docs/erd`에 ERD 문서화
- BDD 지향 테스트
- Docker와 GitHub Actions를 활용한 배포 경로

## 프론트엔드 우선순위

- JavaScript를 우선 사용하는 React/Vite 앱
- API 연동 전 mock data 기반 정적 화면 구현
- API 모듈 중앙 관리
- 로딩, 데이터 없음, 오류, 성공, 401, 403 상태를 명확히 표현
- `VITE_API_BASE_URL`을 사용한 환경별 API URL 관리

## 디자인 자료 메모

- `apps/frontend/design/SVG/plan`에는 기획 자료 페이지가 있습니다.
- `apps/frontend/design/SVG/detail`에는 헤더 변형, 검색 바, 캘린더 모달, 요금 모달, 인원 모달, 지도 검색 결과, 예약 모달, 로그인, 예약 취소, 아이콘, 색상 구현 참고 자료가 있습니다.
- SVG 참고 자료에서 확인한 주요 포인트 컬러는 `#E84C60`입니다.

## 공통 제품 도메인

- IAM
- 카탈로그 및 숙소 관리
- 예약 및 거래
- 실시간 통신
- 인프라 및 코어 시스템
