# AirDnD 프론트엔드 디자인 시스템

이 문서는 현재 Figma export 자료와 구현된 프론트엔드 스타일을 연결하는 기준 문서입니다. 새 화면을 만들거나 기존 화면을 개선할 때 `apps/frontend/src/styles/tokens.css`와 함께 참조합니다.

## 디자인 방향

AirDnD는 숙소 탐색과 예약을 빠르게 완료하는 서비스입니다. 화면은 Airbnb류 숙소 서비스처럼 밝고, 이미지 중심이며, 검색과 예약 액션이 명확해야 합니다.

핵심 원칙:

- 첫 화면에서 검색 경험을 가장 크게 보여줍니다.
- 숙소 카드는 이미지, 위치, 평점, 가격을 빠르게 스캔할 수 있어야 합니다.
- 상세 화면은 큰 이미지 갤러리와 예약 패널을 분리합니다.
- 폼은 넓은 터치 영역, 명확한 라벨, 즉시 보이는 오류 메시지를 사용합니다.
- 관리자/호스트 화면은 마케팅 느낌보다 밀도 있고 운영 도구처럼 보이게 유지합니다.

## 토큰 위치

구현 토큰:

```text
apps/frontend/src/styles/tokens.css
```

전역 레이아웃과 컴포넌트 클래스:

```text
apps/frontend/src/styles/global.css
```

## 색상

Figma export의 `colors.svg`에서 확인한 주요 색상을 토큰화했습니다.

- 브랜드: `#E84C60`
- 성공: `#118917`
- 검정: `#010101`
- 텍스트 기본: `#18181B`
- 보조 텍스트: `#52525B`
- 경계선: `#E6E6E8`
- 배경 보조: `#F7F7F8`

사용 기준:

- 주요 CTA는 브랜드 색상을 사용합니다.
- 오류와 예약 취소 같은 위험 동작은 브랜드 계열의 strong 색상을 사용합니다.
- 성공 상태는 녹색 계열을 사용합니다.
- 운영/관리 화면은 흰색 배경, 얇은 border, 절제된 shadow를 사용합니다.

## 타이포그래피

현재는 시스템 UI 폰트를 사용합니다.

```css
--font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

사용 기준:

- 페이지 H1은 2.1rem부터 2.75rem 사이에서 반응형으로 사용합니다.
- 카드 제목은 1rem 수준으로 유지해 리스트 스캔을 방해하지 않습니다.
- 라벨과 badge는 0.8125rem에서 0.875rem 사이를 사용합니다.
- 자간은 기본값을 유지하고 음수 letter-spacing은 사용하지 않습니다.

## 레이아웃

컨테이너:

```css
--container: 1180px;
```

주요 화면:

- 홈: hero 검색 영역 + 숙소 카드 grid
- 상세: 이미지 갤러리 + 본문 + sticky 예약 패널
- 예약/호스트: list-stack 기반 운영형 리스트
- 관리자: metric-card 기반 대시보드

반응형 기준:

- `980px` 이하: 상세 화면과 검색 바를 1열로 전환
- `640px` 이하: 숙소 카드를 1열로 전환

## 컴포넌트 패턴

### Header

파일:

```text
apps/frontend/src/app/router/AppLayout.tsx
```

기준:

- 브랜드는 좌측, 주요 탐색은 중앙, 로그인/사용자 액션은 우측에 둡니다.
- 모바일에서는 header를 1열로 접고 nav는 가로 스크롤을 허용합니다.

### SearchBar

파일:

```text
apps/frontend/src/features/rooms/ui/SearchBar.tsx
```

기준:

- pill 형태의 큰 검색 바를 사용합니다.
- 지역, 체크인, 체크아웃, 인원은 같은 시각 구조를 갖습니다.
- 검색 버튼은 브랜드 CTA이며 검색 아이콘을 포함합니다.

### RoomCard

파일:

```text
apps/frontend/src/features/rooms/ui/RoomCard.tsx
```

기준:

- 이미지를 가장 큰 시각 요소로 둡니다.
- 제목, 평점, 지역, 가격, 리뷰 수를 카드 하단에 배치합니다.
- hover 시 이미지만 가볍게 확대해 클릭 가능한 카드임을 표시합니다.

### Detail

파일:

```text
apps/frontend/src/pages/rooms/RoomDetailPage.tsx
```

기준:

- 상단은 이미지 갤러리입니다.
- 본문은 소개, 편의시설, 요금 섹션으로 나눕니다.
- 예약 패널은 데스크톱에서 sticky, 모바일에서 본문 아래로 내려갑니다.

### Form

기준:

- 라벨은 항상 표시합니다.
- placeholder는 예시 보조 용도로만 사용합니다.
- 오류 메시지는 필드 바로 아래에 표시합니다.
- 저장/예약 버튼은 full-width가 필요한 맥락에서만 사용합니다.

## 상태 디자인

모든 API 화면은 다음 상태를 가져야 합니다.

- loading: `Loading`
- empty: `EmptyState`
- error: `ErrorMessage`
- success: `state-box success`
- 401: 로그인 유도
- 403: 권한 없음 페이지

## 추가 개선이 필요한 영역

현재 구현은 제품형 기본 화면을 갖췄지만, Figma 원본 수준으로 끌어올리려면 다음 작업이 필요합니다.

- 실제 다중 이미지 갤러리 데이터 구조
- 검색 결과 + 지도 split view
- 캘린더 모달
- 가격 필터 모달
- 인원 조정 모달
- 예약 완료/상세 화면
- 예약 취소 확인 모달
- 호스트 이미지 업로드 UI
- 관리자 숙소 승인 화면
- 사용자 관리 화면

## 새 화면 추가 체크리스트

1. `tokens.css`의 색상/간격/radius/shadow를 먼저 사용합니다.
2. 페이지 H1, 설명, 주요 CTA 위치를 정합니다.
3. loading/empty/error/success 상태를 모두 만듭니다.
4. 모바일 1열 전환을 확인합니다.
5. API 문서와 mock handler를 함께 갱신합니다.
6. 가능하면 Playwright smoke test를 추가합니다.
