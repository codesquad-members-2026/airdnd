# AirDnD 프로젝트

AirDnD는 숙소 예약 서비스를 만드는 모노레포 프로젝트입니다. 프로젝트는 Spring Boot 백엔드와 React/Vite 프론트엔드로 나뉘며, 공통 문서와 배포 관련 파일은 저장소 루트에서 관리합니다.

## 작업 공간 구조

```
apps/
  backend/      Spring Boot 3 API 서버
  frontend/     React + Vite 클라이언트 및 디자인 자료
docs/
  api/          API 명세와 예시
  architecture/ 아키텍처 메모와 다이어그램
  decisions/    ADR 및 팀 의사결정 기록
  erd/          ERD 원본과 내보낸 파일
  learning/     AI Agent 사용 기록을 포함한 팀 학습 기록
  qa/           수동 테스트 시나리오와 릴리스 점검표
infra/
  aws/          AWS 배포 메모와 IaC 초안
  docker/       공통 Docker 자료
  nginx/        리버스 프록시와 HTTPS 설정 초안
scripts/        로컬 자동화 스크립트
```

## 목표 기술 스택

- 백엔드: Spring Boot 3.x, Spring Security, JPA, QueryDSL
- 프론트엔드: React, Vite, JavaScript, React Router, Fetch API
- 인증: GitHub 또는 Google OAuth
- 배포: Docker, GitHub Actions, AWS EC2/RDS, Nginx, HTTPS

## 핵심 제품 흐름

- 게스트: 숙소 검색, 상세 조회, 로그인, 예약 생성, 예약 조회/취소
- 호스트: 숙소 등록, 본인 숙소 관리, 숙소 정보 수정 또는 비활성화
- 관리자/확장 기능: 숙소 승인, 사용자 관리, 대시보드, 알림/채팅, 대기열

## 저장소 작업 방식

- 기능 단위 브랜치를 사용합니다.
- 하나의 기능이 프론트엔드와 백엔드를 모두 건드리면 관련 이슈를 서로 연결합니다.
- UI 변경은 스크린샷을, API 변경은 요청/응답 예시를 PR에 포함합니다.
- API 명세, 환경 변수, 배포 절차가 바뀌면 문서도 함께 갱신합니다.

## 참고 문서

- [디렉터리 가이드](docs/DIRECTORY_GUIDE.md)
- [프론트엔드 디자인 시스템](docs/design/frontend-design-system.md)
