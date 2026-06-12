# SVG 디자인 기준 대비 프론트엔드 정렬 점검

점검 기준:

- `apps/frontend/design/SVG/detail/*.svg`
- `apps/frontend/design/SVG/plan/*.svg`
- 현재 구현: `apps/frontend/src/**/*.tsx`, `apps/frontend/src/styles/global.css`

이 문서는 SVG 파일을 기준으로 현재 프론트엔드에서 스타일이나 구조가 아직 맞지 않는 컴포넌트를 정리합니다. 단, 현재 제품 요구사항 때문에 의도적으로 SVG와 다르게 구현한 항목도 함께 표시합니다.

## SVG 자산 상태

### 렌더링 가능한 파일

대부분의 `detail` 컴포넌트 SVG와 `plan/1.svg`부터 `plan/12.svg`는 `rsvg-convert`로 정상 렌더링됩니다.

정상 렌더링 확인 파일 예시:

- `Header.svg`
- `Responsive Header.svg`
- `Search Bar.svg`
- `Mini Search Bar.svg`
- `calendar.svg`
- `schedule.svg`
- `price.svg`
- `price-1.svg`
- `personnel.svg`
- `personnel-1.svg`
- `reservation.svg`
- `02 캘린더 모달.svg`
- `03 요금 모달.svg`
- `04 인원 조정 모달.svg`
- `07 로그인.svg`
- `08 예약취소.svg`

### 렌더링 실패 파일

다음 SVG는 XML이 끝까지 닫히지 않아 로컬 SVG 렌더러에서 실패했습니다. 디자인 기준으로 쓰기 전에 Figma에서 다시 export하는 것이 좋습니다.

- `apps/frontend/design/SVG/detail/05 검색 결과 및 지도.svg`
- `apps/frontend/design/SVG/detail/05 검색 결과 및 지도 - 검색창 활성화.svg`
- `apps/frontend/design/SVG/detail/06 숙소 예약 모달.svg`
- `apps/frontend/design/SVG/plan/표지.svg`

실패 원인은 모두 `Premature end of data` 계열의 XML parse error입니다.

## 공통 스타일 기준

SVG detail 파일에서 반복되는 기준은 다음과 같습니다.

- 브랜드 컬러: `#E84C60`
- 기본 텍스트: `#333333`
- 보조 텍스트: `#828282`
- 구분선: `#E0E0E0`, `#C4C4C4`, `#BDBDBD`
- 큰 검색바: 높이 약 77px, pill radius 약 38.5px
- 미니 검색바: 높이 약 47px, pill radius 약 23.5px
- 드롭다운/모달 패널: 흰 배경, radius 40px, 약한 이중 그림자
- 검색 CTA: 브랜드 컬러 원형 또는 pill 버튼
- Header 사용자 액션: 메뉴 아이콘 + 사용자 아이콘이 들어간 75x39 pill

현재 `tokens.css`와 `global.css`는 브랜드 컬러와 주요 토큰은 맞지만, 일부 컴포넌트의 구조와 밀도는 SVG 기준과 다릅니다.

## 미정렬 컴포넌트 목록

### 1. Header / User Menu

관련 SVG:

- `Header.svg`
- `Responsive Header.svg`
- `07 로그인.svg`
- `08 예약취소.svg`

현재 구현:

- `apps/frontend/src/app/router/AppLayout.tsx`
- `apps/frontend/src/styles/global.css`

차이점:

- SVG는 우측에 `메뉴 + 유저`가 들어간 하나의 pill 버튼을 사용합니다.
- 현재 구현은 로그인 전에는 `로그인` 버튼, 로그인 후에는 사용자 chip, 알림 아이콘, 로그아웃 버튼을 각각 노출합니다.
- SVG는 프로필 메뉴를 열면 작은 흰색 dropdown에 `로그인` 또는 `예약 취소 / 위시리스트 / 로그아웃`을 표시합니다.
- 현재 구현에는 header dropdown menu가 없습니다.
- SVG의 nav 항목은 `숙소`, `체험`, `온라인 체험` 중심인데, 현재 구현은 `숙소`, `지도`, `예약`, `호스트`, `관리자` 중심입니다.

판단:

- 제품 기능상 관리자/호스트 링크가 필요하므로 nav 항목 차이는 의도된 차이일 수 있습니다.
- 하지만 우측 사용자 액션은 SVG 스타일과 명확히 다릅니다.

개선 우선순위:

- `P1`: header 우측 액션을 `menu/user pill + dropdown` 구조로 바꾸기.
- `P1`: 알림은 dropdown 내부 또는 pill 옆 badge로 통합하기.
- `P2`: 관리자/호스트 링크는 role별 dropdown 항목으로 이동해 public header를 더 단순화하기.

### 2. Home Hero / Landing Content

관련 SVG:

- `07 로그인.svg`
- `08 예약취소.svg`
- `02 캘린더 모달.svg`
- `03 요금 모달.svg`
- `04 인원 조정 모달.svg`

현재 구현:

- `apps/frontend/src/pages/rooms/HomePage.tsx`
- `apps/frontend/src/styles/global.css`

차이점:

- SVG는 첫 화면에 full-width hero image를 크게 깔고, header와 search bar를 이미지 위에 배치합니다.
- 현재 구현은 `home-hero` 카드형 영역 안에 텍스트 heading, meta chip, 검색바, 배경 이미지를 함께 넣습니다.
- SVG는 landing 아래에 `가까운 여행지 둘러보기`, 카테고리 카드, footer가 이어집니다.
- 현재 구현은 hero 아래 바로 숙소 카드 grid로 이어집니다.

판단:

- 현재 구현은 “usable app first” 방향에는 맞지만, SVG의 Airbnb-like landing style과는 다릅니다.

개선 우선순위:

- `P1`: 홈 첫 화면을 full-bleed image hero + overlay search bar로 전환.
- `P2`: 근거리 여행지/카테고리 섹션을 mock data 기반으로 추가.
- `P2`: 현재 hero meta chip은 SVG에는 없는 요소이므로 제거 또는 아래 섹션으로 이동.

### 3. Search Bar

관련 SVG:

- `Search Bar.svg`
- `Mini Search Bar.svg`
- `05 검색 결과 및 지도.svg`
- `05 검색 결과 및 지도 - 검색창 활성화.svg`

현재 구현:

- `apps/frontend/src/features/rooms/ui/SearchBar.tsx`
- `apps/frontend/src/styles/global.css`

차이점:

- SVG detail 검색바는 `체크인 / 체크아웃 / 요금 / 인원` 4개 필드 중심입니다.
- 현재 검색바는 `지역 / 체크인 / 체크아웃 / 가격 / 인원` 5개 필드입니다.
- SVG에는 선택된 필드 옆에 `x` clear control이 있습니다.
- 현재 검색바에는 field-level clear control이 없습니다.
- SVG의 검색 버튼은 원형 아이콘-only 또는 `검색` pill 변형이 있고, 현재는 text+icon pill에 가깝습니다.
- SVG 미니 검색바는 지도/결과 화면에서 compact header search로 사용됩니다.
- 현재 map page도 같은 큰 search bar를 사용합니다.

판단:

- 지역 검색 필드는 실제 서비스에는 필요하므로 유지할 수 있습니다.
- 다만 map/result 화면에서는 `Mini Search Bar.svg` 기준 compact search로 바꾸는 것이 맞습니다.

개선 우선순위:

- `P1`: 검색 결과/지도 화면에는 mini search bar variant 적용.
- `P1`: 선택된 체크인/체크아웃/가격/인원 필드에 clear button 추가.
- `P2`: 큰 검색바는 홈 전용, 작은 검색바는 결과/지도 전용으로 분리.

### 4. Calendar Dropdown

관련 SVG:

- `calendar.svg`
- `schedule.svg`
- `02 캘린더 모달.svg`

현재 구현:

- `SearchBar.tsx`의 `CalendarPopover`
- `global.css`의 `.calendar-popover`

맞는 부분:

- 현재는 native date input이 아니라 커스텀 2개월 calendar dropdown을 사용합니다.
- 패널 폭, 40px radius, 흰 배경, 그림자는 SVG 기준에 가까워졌습니다.
- 선택 날짜는 검은 원형 스타일로 표현합니다.

차이점:

- SVG는 header summary 없이 월 navigation과 달력 자체가 훨씬 여백 있게 배치됩니다.
- SVG는 range band가 행 단위로 부드럽게 이어집니다. 현재는 각 날짜 cell 단위 배경입니다.
- SVG 기준 calendar panel 높이는 약 512px인데, 현재 구현은 콘텐츠 높이에 따라 더 compact합니다.
- SVG의 disabled/available date 색상 대비와 현재 disabled opacity가 약간 다릅니다.

개선 우선순위:

- `P1`: range background를 row band처럼 이어지게 개선.
- `P2`: SVG와 맞추려면 header summary를 제거하거나 더 작게 축소.
- `P2`: month grid 간격과 day cell 크기를 SVG에 더 가깝게 조정.

### 5. Price Dropdown

관련 SVG:

- `price.svg`
- `price-1.svg`
- `03 요금 모달.svg`

현재 구현:

- `SearchBar.tsx`의 price popover
- `global.css`의 `.price-popover`, `.price-histogram`, `.range-slider`

맞는 부분:

- 패널 폭은 SVG의 실제 panel width인 약 493px에 맞춰져 있습니다.
- 가격 범위와 range control은 동작합니다.
- 패널 radius와 shadow는 SVG 기준에 가까워졌습니다.

차이점:

- SVG는 연속된 산 모양 가격 분포 그래프입니다.
- 현재 구현은 bar histogram입니다.
- SVG에는 평균 1박 요금 안내가 있습니다. 현재 구현에는 평균 요금 copy가 없습니다.
- SVG는 numeric input이 없습니다. 현재 구현에는 min/max number input이 있습니다.
- SVG는 손잡이가 작은 원형으로 그래프 하단 baseline 위에 붙어 있습니다. 현재 구현은 독립 range slider입니다.

판단:

- 현재 구현은 usability는 좋지만, visual alignment는 아직 부족합니다.

개선 우선순위:

- `P1`: histogram bars를 SVG-like filled area chart로 교체.
- `P1`: 평균 1박 요금 문구 추가.
- `P2`: numeric input은 고급 제어로 접거나, SVG 기준대로 제거.

### 6. Personnel Dropdown

관련 SVG:

- `personnel.svg`
- `personnel-1.svg`
- `04 인원 조정 모달.svg`

현재 구현:

- `SearchBar.tsx`의 occupancy popover
- `global.css`의 `.occupancy-popover`, `.occupancy-row`, `.stepper`

맞는 부분:

- 패널 폭은 SVG의 실제 panel width인 약 400px에 맞춰져 있습니다.
- 성인/아동/유아 row와 plus/minus stepper 구조는 SVG와 비슷합니다.
- max 8명 제한과 disabled state가 있습니다.

차이점:

- SVG는 세 row만 있고 아주 단순합니다.
- 현재 구현은 반려동물 filter row가 포함되어 있습니다. 이는 최근 제품 요구사항 때문에 의도적으로 다릅니다.
- SVG의 row 높이는 더 크고, 카운터 숫자와 stepper가 더 큽니다.
- SVG label은 `어린이`인데 현재는 `아동`입니다.
- SVG description은 `만 2~12세`, 현재는 `만 2-12세, 최대 8명`입니다.

판단:

- 반려동물 이동은 요구사항 반영이므로 유지해야 합니다.
- 다만 row typography와 button size는 SVG 쪽이 더 정돈되어 있습니다.

개선 우선순위:

- `P1`: stepper button을 30~32px 원형, count typography를 더 굵고 크게 조정.
- `P2`: `아동`을 `어린이`로 바꿀지 용어 결정.
- `P2`: max 안내는 tooltip/help text로 빼면 SVG와 더 가까워집니다.

### 7. Map Search Result View

관련 SVG:

- `05 검색 결과 및 지도.svg`
- `05 검색 결과 및 지도 - 검색창 활성화.svg`

현재 구현:

- `apps/frontend/src/pages/map/MapSearchPage.tsx`
- `global.css`의 `.map-layout`, `.map-panel`, `.map-marker`

자산 문제:

- 두 map SVG는 XML parse error로 렌더링되지 않습니다.
- 그래도 SVG source와 파일명 기준으로 검색 결과 + 지도 split view와 active search state가 목표임을 확인할 수 있습니다.

차이점:

- SVG는 우측에 실제 지도 bitmap, 좌측/상단에 compact search와 result cards가 있는 구조입니다.
- 현재 구현은 CSS gradient/grid placeholder map입니다.
- 현재 result card는 운영형 card 스타일이고, SVG 기준의 compact listing card와 다릅니다.
- 현재 map page에서도 home search bar와 같은 큰 search bar를 씁니다.

개선 우선순위:

- `P0`: Figma에서 map SVG를 다시 export해 정상 자산 확보.
- `P1`: map page에 `Mini Search Bar` variant 적용.
- `P1`: 지도 placeholder를 실제 지도 SDK 또는 mock map image로 교체.
- `P2`: result card를 지도 화면 전용 compact card로 분리.

### 8. Reservation Panel / Reservation Modal

관련 SVG:

- `reservation.svg`
- `06 숙소 예약 모달.svg`

현재 구현:

- `apps/frontend/src/features/reservations/ui/ReservationForm.tsx`
- `apps/frontend/src/pages/reservations/ReservationDetailPage.tsx`
- `global.css`의 `.reservation-panel`

자산 문제:

- `06 숙소 예약 모달.svg`는 XML parse error로 렌더링되지 않습니다.
- `reservation.svg`는 정상이며 booking widget 기준으로 사용할 수 있습니다.

차이점:

- SVG booking panel은 date/person field grid, black reserve CTA, fee breakdown, total row가 포함됩니다.
- 현재 reservation panel은 훨씬 단순한 form/panel이며 fee breakdown이 부족합니다.
- SVG CTA는 black primary button이고, 현재는 brand color CTA를 사용합니다.
- SVG의 입력 영역은 하나의 bordered box 안에서 check-in/check-out/personnel을 나눕니다.
- 현재 구현은 앱 공통 form style에 가깝습니다.

개선 우선순위:

- `P1`: room detail 예약 패널을 `reservation.svg` 기준으로 재구성.
- `P1`: 숙박비, 서비스 수수료, 숙박세/수수료, 총액 breakdown 추가.
- `P2`: 예약 완료/예약 상세 화면도 booking card style과 맞추기.

### 9. Login / Account Dropdown

관련 SVG:

- `07 로그인.svg`
- `08 예약취소.svg`
- `Header.svg`

현재 구현:

- `apps/frontend/src/pages/auth/LoginPage.tsx`
- `AppLayout.tsx`

차이점:

- SVG의 로그인은 별도 로그인 페이지가 아니라 header profile dropdown의 한 항목입니다.
- 현재는 `/login` route의 full page auth card입니다.
- 현재 mock role 선택 UI는 개발에는 유용하지만 production style과는 맞지 않습니다.

개선 우선순위:

- `P1`: production UI에서는 header dropdown에서 OAuth provider login으로 진입.
- `P1`: mock role login은 개발 전용 패널로 숨기거나 dev-only 표시.
- `P2`: 로그인 페이지가 필요하면 full hero/landing style과 맞춰 별도 디자인 필요.

### 10. Footer

관련 SVG:

- `07 로그인.svg`
- `08 예약취소.svg`

현재 구현:

- `AppLayout.tsx`
- `global.css`의 `.site-footer`

맞는 부분:

- 소개, 커뮤니티, 호스팅, 지원 컬럼 구조는 SVG와 유사합니다.

차이점:

- SVG footer는 더 많은 항목과 하단 법적 링크 라인을 포함합니다.
- 현재 footer는 placeholder 수준으로 더 간결합니다.
- SVG는 page-level landing footer이고, 현재는 모든 route에 고정적으로 노출됩니다.

개선 우선순위:

- `P2`: footer 항목을 SVG 수준으로 확장.
- `P2`: 운영/admin 페이지에서는 footer 노출을 줄일지 결정.

### 11. Room Detail Gallery

관련 SVG:

- full page detail SVG들 상단 hero/detail 영역

현재 구현:

- `RoomDetailPage.tsx`
- `.detail-gallery`

차이점:

- SVG는 실제 숙소/여행 이미지 중심의 큰 hero visual을 강조합니다.
- 현재 detail gallery는 같은 이미지 반복과 tint tile로 구성됩니다.
- 실제 multi-image 데이터 구조가 없어서 SVG 수준의 gallery가 어렵습니다.

개선 우선순위:

- `P1`: room image list schema/API 확정 후 real multi-image gallery 구현.
- `P2`: 이미지가 1장뿐인 경우 fallback layout 별도 제공.

### 12. Plan SVG와 현재 구현 차이

관련 SVG:

- `apps/frontend/design/SVG/plan/1.svg` ~ `12.svg`

판단:

- plan SVG는 세부 컴포넌트 구현 기준이라기보다 기획/흐름 설명 자료입니다.
- 현재 구현에 일부 반영된 항목: 숙소 검색, 상세, 예약, 호스트, 관리자, 알림.
- 현재 구현에 아직 부족한 항목: 위시리스트, 리뷰, 실제 지도, production OAuth dropdown, 예약 취소 modal, fee breakdown, landing content.

## 우선 개선 순서

### P0: 디자인 자산 복구

1. `05 검색 결과 및 지도.svg` 재export.
2. `05 검색 결과 및 지도 - 검색창 활성화.svg` 재export.
3. `06 숙소 예약 모달.svg` 재export.
4. `plan/표지.svg` 재export.

### P1: 사용자에게 바로 보이는 핵심 불일치

1. Header user pill/dropdown 구조 적용.
2. Home hero를 full-bleed image + overlay search 구조로 전환.
3. Map page에는 mini search bar와 지도 전용 result card 적용.
4. Reservation panel을 `reservation.svg` 기준으로 재구성.
5. Price dropdown graph를 continuous filled area chart로 변경.
6. Calendar range band를 SVG처럼 row-level 연결형으로 개선.

### P2: 세부 polish

1. Personnel stepper typography/spacing 조정.
2. Footer 항목 확장.
3. Login mock UI를 dev-only로 분리.
4. Room detail multi-image gallery 개선.
5. Search field clear button 추가.

## 결론

현재 프론트엔드는 기본 기능과 흐름은 갖췄지만, SVG 기준의 Airbnb-like visual language와 아직 가장 크게 어긋나는 영역은 다음입니다.

1. Header account menu
2. Home hero/landing structure
3. Reservation panel
4. Map search result page
5. Price graph modal

검색바와 calendar/personnel/price popover는 최근 개선으로 구조는 가까워졌지만, 세부 visual fidelity는 아직 SVG와 차이가 있습니다.
