# Google Maps 기능 구현 가이드

## 1. 문서 목적

이 문서는 AirDnD 프로젝트에 Google Maps 기반 위치 기능을 추가하기 위한 설계 및 구현 가이드입니다.

구현 목표는 다음 세 가지입니다.

1. 숙소 상세 화면에서 숙소 위치를 지도에 표시합니다.
2. 지도 검색 화면에서 검색된 숙소들을 실제 위치에 표시합니다.
3. 호스트가 숙소를 등록하거나 수정할 때 지도에서 정확한 위치를 지정합니다.

이 문서는 현재 프로젝트 구조를 기준으로 작성되었으며, 구현 순서, 데이터 계약, 보안, 비용, 개인정보 보호, 테스트 전략을 함께 설명합니다.

---

## 2. 현재 프로젝트 상태

### 이미 준비된 부분

- `rooms` 테이블에 `latitude`, `longitude` 컬럼이 존재합니다.
- 백엔드 `HostRoomRequest`가 위도와 경도를 필수로 받습니다.
- 숙소 상세 응답과 호스트 숙소 응답에 위도와 경도가 포함됩니다.
- 프론트엔드 `roomDetailSchema`가 위도와 경도를 검증합니다.
- mock 숙소 데이터에 실제 형태의 좌표가 포함되어 있습니다.
- `/rooms/map` 화면에 목록과 지도 패널을 나누는 기본 레이아웃이 있습니다.

### 현재 제한 사항

1. 지도 검색 화면은 실제 지도가 아니라 CSS 비율로 마커를 배치합니다.
2. 숙소 등록 API 요청은 모든 숙소에 동일한 서울 좌표를 전송합니다.
3. 호스트 숙소 등록 폼에는 주소를 입력하는 필드만 있고 지도 위치 확인 기능이 없습니다.
4. 숙소 목록 응답 타입인 `RoomSummary`에는 좌표가 없습니다.
5. 지도에 표시된 영역을 기준으로 숙소를 검색하는 백엔드 API가 없습니다.

### 현재 제거해야 하는 임시 처리

`apps/frontend/src/features/host/api/hostApi.ts`에는 다음과 같은 고정 좌표가 있습니다.

```ts
countryCode: 'KR',
latitude: 37.5665,
longitude: 126.978,
```

위 값은 호스트 위치 선택 기능이 구현된 후 반드시 제거해야 합니다. 사용자가 위치를 선택하지 않았을 때 서울 좌표를 자동으로 저장해서는 안 됩니다.

---

## 3. 권장 기술 선택

### 프론트엔드 패키지

```bash
npm install @vis.gl/react-google-maps @googlemaps/markerclusterer
```

### 패키지 역할

`@vis.gl/react-google-maps`

- React 컴포넌트 형태로 Google Maps JavaScript API를 사용합니다.
- `APIProvider`, `Map`, `AdvancedMarker`, `InfoWindow`, `useMap` 등을 제공합니다.
- 직접 script 태그와 전역 callback을 관리하는 복잡성을 줄입니다.

`@googlemaps/markerclusterer`

- 지도에 숙소 마커가 많을 때 가까운 마커를 그룹으로 표시합니다.
- 화면 복잡도와 렌더링 비용을 줄입니다.

### 사용하지 않을 방식

- Google Maps 스크립트를 각 페이지에서 개별적으로 로드하지 않습니다.
- 직접 만든 script loader를 사용하지 않습니다.
- CSS 좌표 비율로 지도 마커를 흉내 내지 않습니다.
- deprecated 상태인 Google Drawing Library에 의존하지 않습니다.

---

## 4. Google Cloud 설정

### 4.1 프로젝트 및 결제 설정

Google Cloud Console에서 프로젝트를 생성하거나 기존 프로젝트를 선택하고 결제를 활성화합니다.

활성화할 API:

- Maps JavaScript API
- Places API (New)
- Geocoding API

Maps JavaScript API는 실제 지도 표시를 위해 필수입니다.

Places API는 주소 자동완성과 장소 선택을 위해 권장합니다.

Geocoding API는 좌표를 주소로 변환하거나 주소를 좌표로 변환해야 할 때 사용합니다.

### 4.2 Map ID 생성

JavaScript용 Map ID를 생성합니다. Advanced Marker를 사용하려면 Map ID가 필요합니다.

개발 초기에만 `DEMO_MAP_ID`를 임시로 사용할 수 있습니다. 운영 환경에서는 프로젝트에서 생성한 Map ID를 사용합니다.

### 4.3 브라우저 API 키 제한

브라우저에서 사용할 API 키를 생성하고 웹사이트 제한을 설정합니다.

허용할 로컬 주소:

```text
http://127.0.0.1:5173/*
```

운영 주소 예시:

```text
https://your-production-domain.com/*
```

허용 API:

```text
Maps JavaScript API
Places API (New)
Geocoding API
```

브라우저용 API 키는 JavaScript 번들에서 보이는 것이 정상입니다. 키를 숨기는 대신 웹사이트 제한과 API 제한을 반드시 적용해야 합니다.

백엔드에서 Google Maps API를 호출해야 한다면 브라우저용 키를 재사용하지 않고 서버 IP 제한이 적용된 별도 키를 사용합니다.

### 4.4 프론트엔드 환경 변수

```env
VITE_GOOGLE_MAPS_API_KEY=실제-브라우저-api-key
VITE_GOOGLE_MAPS_MAP_ID=실제-map-id
```

실제 값이 들어간 `.env` 파일은 Git에 커밋하지 않습니다.

### 4.5 비용 및 할당량

- Google Maps Platform은 사용량에 따라 비용이 발생할 수 있습니다.
- 배포 전 결제 예산 알림을 설정합니다.
- API별 일일 또는 분당 할당량을 설정합니다.
- 개발 중에도 불필요한 지도 재로딩과 요청 반복을 피합니다.

---

## 5. 권장 프론트엔드 구조

```text
src/features/maps/
  config/
    mapsConfig.ts
  model/
    locationTypes.ts
  ui/
    RoomLocationMap.tsx
    RoomResultsMap.tsx
    LocationPicker.tsx
    RoomMapMarker.tsx
```

### 공통 좌표 타입

```ts
export type Coordinates = {
  latitude: number;
  longitude: number;
};
```

### 좌표 유효성 검증

```ts
latitude: z.number().min(-90).max(90),
longitude: z.number().min(-180).max(180),
```

위도와 경도는 프론트엔드와 백엔드 양쪽에서 모두 검증해야 합니다.

### 전역 Maps Provider

Google Maps API는 애플리케이션 전체에서 한 번만 로드합니다.

```tsx
<APIProvider apiKey={env.googleMapsApiKey}>
  <RouterProvider router={router} />
</APIProvider>
```

페이지마다 `APIProvider`를 생성하지 않습니다.

---

## 6. 기능 1: 숙소 상세 위치 지도

숙소 상세 지도는 가장 먼저 구현하기 좋은 기능입니다.

현재 숙소 상세 응답에 좌표가 이미 포함되어 있으므로 백엔드 계약 변경 없이 구현할 수 있습니다.

### 목표 화면

```text
숙소 위치
[읽기 전용 지도]
서울특별시 성동구 성수동
[Google 지도에서 보기]
```

### 기본 구현 예시

```tsx
<Map
  defaultCenter={{ lat: room.latitude, lng: room.longitude }}
  defaultZoom={16}
  mapId={env.googleMapsMapId}
  gestureHandling="cooperative"
>
  <AdvancedMarker
    position={{ lat: room.latitude, lng: room.longitude }}
    title={room.name}
  />
</Map>
```

### 권장 동작

- 숙소 좌표를 중심으로 지도를 표시합니다.
- 숙소 위치에 마커 하나를 표시합니다.
- 페이지 스크롤 중 지도가 의도치 않게 이동하지 않도록 `gestureHandling="cooperative"`를 사용합니다.
- 지도 컨테이너에 고정 높이를 지정해 레이아웃 이동을 방지합니다.
- 외부 Google 지도 링크를 함께 제공합니다.
- 지도 로딩 실패 상태를 별도로 표시합니다.

### 개인정보 보호 결정

숙소가 개인 주택일 수 있으므로 예약 전 정확한 위치를 공개할지 결정해야 합니다.

가능한 정책:

1. 모든 사용자에게 정확한 위치를 공개합니다.
2. 공개 화면에는 반올림한 대략적 좌표만 제공합니다.
3. 예약이 확정된 사용자에게만 정확한 좌표를 제공합니다.
4. 공개 지도에는 정확한 마커 대신 대략적인 반경을 표시합니다.

정확한 주거 위치가 포함될 수 있다면 두 번째 또는 세 번째 정책을 권장합니다.

---

## 7. 기능 2: 지도 기반 숙소 검색

### 7.1 RoomSummary 계약 변경

지도 검색 결과의 모든 숙소에는 좌표가 필요합니다.

프론트엔드 `RoomSummary`에 다음 필드를 추가합니다.

```ts
latitude: z.number().min(-90).max(90),
longitude: z.number().min(-180).max(180),
```

백엔드 숙소 목록 응답에도 같은 필드를 포함해야 합니다.

### 7.2 실제 지도와 마커

현재 `/rooms/map`의 CSS placeholder를 실제 지도 컴포넌트로 교체합니다.

```tsx
<Map defaultCenter={DEFAULT_KOREA_CENTER} defaultZoom={7}>
  {rooms.map((room) => (
    <AdvancedMarker
      key={room.id}
      position={{ lat: room.latitude, lng: room.longitude }}
    />
  ))}
</Map>
```

### 7.3 필수 상호작용

- 숙소 카드에 마우스를 올리면 해당 마커를 강조합니다.
- 마커에 마우스를 올리거나 클릭하면 해당 숙소 카드를 강조합니다.
- 마커 클릭 시 가격, 이름, 대표 이미지가 포함된 간단한 미리보기를 표시합니다.
- 미리보기 클릭 시 숙소 상세 페이지로 이동합니다.
- 최초 검색 결과를 모두 볼 수 있도록 지도 bounds를 자동 조정합니다.
- 마커가 많으면 clustering을 적용합니다.

권장 상태:

```ts
const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
const [hoveredRoomId, setHoveredRoomId] = useState<number | null>(null);
```

### 7.4 지도 영역 기반 검색

장기적으로는 현재 지도에 보이는 영역 안의 숙소만 조회해야 합니다.

권장 API:

```http
GET /api/rooms/map?south=37.4&west=126.7&north=37.8&east=127.2
```

초기 SQL:

```sql
WHERE latitude BETWEEN :south AND :north
  AND longitude BETWEEN :west AND :east
```

현재 프로젝트 규모에서는 위도와 경도 범위 검색으로 충분합니다.

숙소 수가 크게 증가하면 다음을 검토합니다.

- MySQL `POINT SRID 4326`
- spatial index
- 거리 기반 정렬
- 지도 zoom 수준별 결과 제한

### 7.5 검색 요청 시점

지도 이동 이벤트마다 API를 호출하지 않습니다.

권장 흐름:

```text
사용자가 지도 이동
→ 지도 이동 종료
→ "이 지역 검색" 버튼 표시
→ 사용자가 버튼 클릭
→ 현재 bounds로 숙소 조회
```

이 방식은 불필요한 API 요청과 사용자가 원하지 않는 결과 갱신을 줄입니다.

검색 필터와 지도 bounds는 URL search parameter에 저장하는 것이 좋습니다. 그러면 검색 결과를 공유하거나 새로고침해도 상태를 복원할 수 있습니다.

---

## 8. 기능 3: 호스트 숙소 위치 선택

숙소 등록 위치 선택은 저장되는 데이터의 정확성을 결정하므로 가장 신중하게 구현해야 합니다.

### 목표 화면

```text
주소 검색
[Places 자동완성 입력]

선택한 주소
[전체 주소]

선택한 위치 확인
[읽기 전용 지도와 마커]

위도 / 경도
[읽기 전용 값]
```

### 권장 사용자 흐름

1. 호스트가 Places 자동완성으로 주소를 검색합니다.
2. 선택한 Place에서 주소와 좌표를 가져옵니다.
3. Places 주소 구성요소에서 지역과 국가 코드를 추출합니다.
4. 지도를 해당 좌표로 이동하고 읽기 전용 마커를 표시합니다.
5. 주소, 지역, 국가 코드, 위도, 경도를 React Hook Form 상태에 저장합니다.
6. 선택한 위치 정보를 백엔드에 전송합니다.

숙소 위치는 Places 검색 결과에서만 선택할 수 있습니다. 주소와 좌표의 불일치를 방지하기 위해 지도 클릭 및 마커 드래그로 좌표를 변경하지 않습니다. 등록 후 숙소 위치도 수정할 수 없으며, 실제 위치가 변경되었다면 새 숙소로 등록합니다.

### Places에서 필요한 필드

필요한 데이터만 요청합니다.

```ts
await place.fetchFields({
  fields: ['formattedAddress', 'location'],
});
```

불필요한 필드를 요청하지 않으면 비용과 데이터 처리를 줄일 수 있습니다.

### 호스트 폼 스키마 변경

```ts
latitude: z.coerce.number().min(-90).max(90),
longitude: z.coerce.number().min(-180).max(180),
countryCode: z.string().length(2),
```

React Hook Form 연동 예시:

```ts
setValue('latitude', selectedPosition.lat, { shouldValidate: true });
setValue('longitude', selectedPosition.lng, { shouldValidate: true });
setValue('address', formattedAddress, { shouldValidate: true });
```

### 중요한 검증 규칙

- 위치를 선택하지 않은 상태에서는 숙소 등록을 허용하지 않습니다.
- 주소 문자열만 입력하고 좌표를 선택하지 않은 경우 오류를 표시합니다.
- 위도와 경도는 백엔드에서도 범위를 검증합니다.
- 프론트엔드에서 전송한 좌표를 무조건 신뢰하지 않습니다.
- 숙소 수정 화면에서는 기존 좌표를 읽기 전용 지도에 표시합니다.
- 등록된 숙소의 위치가 변경되었다면 기존 숙소를 수정하지 않고 새 숙소로 등록합니다.

---

## 9. 백엔드 및 API 변경

### 숙소 목록 응답

지도 검색에 필요한 좌표를 포함합니다.

```json
{
  "id": 101,
  "name": "성수 루프탑 스테이",
  "latitude": 37.5446,
  "longitude": 127.0557
}
```

### 숙소 상세 응답

현재 좌표를 포함하고 있으므로 계약을 유지합니다.

### 호스트 숙소 등록 및 수정

현재 등록 요청은 좌표를 받습니다. 수정 API도 좌표 변경을 저장하는지 반드시 확인해야 합니다.

### 지도 검색 전용 응답

지도 검색 결과가 커지면 전체 숙소 상세 데이터를 반환하지 않고 가벼운 응답 타입을 만듭니다.

예시:

```json
{
  "id": 101,
  "name": "성수 루프탑 스테이",
  "pricePerNight": 145000,
  "imageUrl": "https://example.com/image.jpg",
  "latitude": 37.5446,
  "longitude": 127.0557
}
```

### 좌표 정밀도

현재 DB는 `DECIMAL(15, 12)`를 사용합니다. 지도 표시와 일반적인 숙소 위치 저장에 충분합니다.

공개 API에서 대략적 위치만 제공하려면 응답 시 좌표를 반올림하고, DB에는 정확한 좌표를 유지하는 방식을 사용할 수 있습니다.

---

## 10. 오류 및 예외 처리

지도 기능은 다음 상태를 명시적으로 처리해야 합니다.

- Google Maps API 키 누락
- API 키의 웹사이트 제한 설정 오류
- Maps JavaScript API 로딩 실패
- Places 검색 결과에 좌표가 없음
- 네트워크 연결 끊김
- 백엔드에서 잘못된 좌표 반환
- 현재 지도 영역에 숙소가 없음
- 호스트가 위치를 선택하지 않음
- Geocoding 또는 Places 할당량 초과

지도 로딩이 실패하더라도 숙소 상세의 나머지 내용과 검색 목록은 사용할 수 있어야 합니다.

---

## 11. 성능 고려사항

- Maps API는 애플리케이션에서 한 번만 로드합니다.
- 숙소 상세 지도는 해당 영역이 화면에 가까워질 때 lazy rendering을 고려합니다.
- 많은 마커는 clustering을 적용합니다.
- 지도 pan 또는 zoom 이벤트마다 API를 호출하지 않습니다.
- Places API에서 필요한 필드만 요청합니다.
- 모든 지도 컨테이너에 안정적인 높이를 지정합니다.
- 전국 숙소 전체를 한 번에 계속 로드하지 않습니다.
- 지도 검색에는 가벼운 전용 응답 DTO를 고려합니다.
- 마커 컴포넌트가 불필요하게 다시 생성되지 않도록 상태와 memoization을 관리합니다.

---

## 12. 테스트 전략

### 단위 테스트

- 위도 범위 `-90 ~ 90` 검증
- 경도 범위 `-180 ~ 180` 검증
- 지도 bounds query parameter 직렬화
- Places 선택 결과를 폼 값으로 변환하는 로직
- 잘못된 좌표 처리

### 컴포넌트 테스트

- 좌표를 선택하지 않으면 호스트 폼 제출이 차단되는지 확인
- 주소 선택 후 주소와 좌표가 폼에 반영되는지 확인
- 마커 클릭 시 해당 숙소가 선택되는지 확인
- 숙소 카드 hover와 지도 마커 강조가 연결되는지 확인

### E2E 테스트

- 지도 검색 페이지에서 숙소 마커가 표시되는지 확인
- 마커를 클릭해 숙소 상세로 이동하는지 확인
- 숙소 상세에서 위치 지도가 표시되는지 확인
- 호스트가 주소를 검색하면 Places에서 추출한 지역과 좌표가 제출되는지 확인
- 숙소 등록 마커가 드래그되지 않고 지도 클릭으로 좌표가 변경되지 않는지 확인

대부분의 자동화 테스트에서는 Google Maps provider를 mock 처리합니다.

실제 Google Maps를 사용하는 smoke test는 별도로 제한적으로 실행합니다. 실제 API 테스트는 속도가 느리고 비용이 발생할 수 있습니다.

---

## 13. 권장 구현 순서

### 1단계: 기반 설정

1. Google Cloud 프로젝트와 결제를 설정합니다.
2. Maps JavaScript API, Places API, Geocoding API를 활성화합니다.
3. 제한된 브라우저 API 키와 Map ID를 생성합니다.
4. 프론트엔드 환경 변수를 추가합니다.
5. `@vis.gl/react-google-maps`를 설치합니다.
6. 공통 `APIProvider`와 지도 로딩/오류 상태를 구현합니다.

### 2단계: 숙소 상세 지도

1. 읽기 전용 `RoomLocationMap`을 구현합니다.
2. 숙소 상세 페이지에 위치 섹션을 추가합니다.
3. 외부 Google 지도 링크를 추가합니다.
4. 정확한 위치 공개 정책을 적용합니다.

### 3단계: 지도 검색

1. 숙소 목록 응답에 좌표를 추가합니다.
2. `/rooms/map`의 placeholder를 실제 지도로 교체합니다.
3. 숙소 카드와 마커 선택 상태를 연결합니다.
4. InfoWindow 또는 숙소 미리보기를 구현합니다.
5. marker clustering을 적용합니다.

### 4단계: 호스트 위치 선택

1. 호스트 폼 스키마에 주소, 국가 코드, 좌표 필드를 추가합니다.
2. Places 자동완성을 구현합니다.
3. Places 결과 위치를 읽기 전용으로 확인하는 `LocationPicker`를 구현합니다.
4. 고정 서울 좌표를 제거합니다.
5. 수정 화면에서도 기존 위치를 변경할 수 있도록 합니다.

### 5단계: 지도 영역 기반 검색

1. 지도 bounds 기반 API를 설계합니다.
2. 위도와 경도 범위 검색을 구현합니다.
3. "이 지역 검색" 흐름을 구현합니다.
4. 필요 시 spatial index와 전용 지도 응답 DTO를 도입합니다.

---

## 14. 완료 기준

다음 조건을 모두 충족하면 기본 Google Maps 기능 구현이 완료된 것으로 판단합니다.

- 숙소 상세 화면에서 저장된 좌표에 마커가 표시됩니다.
- 지도 검색 결과의 모든 숙소가 실제 좌표에 표시됩니다.
- 숙소 목록과 지도 마커 선택 상태가 연결됩니다.
- 호스트가 Places 주소 검색 결과에서 숙소 위치와 지역을 선택할 수 있습니다.
- 숙소 등록 및 수정 화면에서 호스트가 좌표를 직접 변경할 수 없습니다.
- 호스트가 위치를 선택하지 않으면 숙소를 저장할 수 없습니다.
- 고정 서울 좌표가 제거되었습니다.
- 좌표가 프론트엔드와 백엔드 양쪽에서 검증됩니다.
- API 키에 웹사이트 및 API 제한이 적용되어 있습니다.
- 지도 로딩 실패와 빈 결과 상태가 처리됩니다.
- 지도 관련 단위 테스트, 컴포넌트 테스트, E2E 테스트가 존재합니다.

---

## 15. 참고 자료

- [Maps JavaScript API 개요](https://developers.google.com/maps/documentation/javascript/overview)
- [Google Maps React Codelab](https://developers.google.com/codelabs/maps-platform/maps-platform-101-react-js)
- [Advanced Markers 시작하기](https://developers.google.com/maps/documentation/javascript/advanced-markers/start)
- [Marker Clustering](https://developers.google.com/maps/documentation/javascript/marker-clustering)
- [Place Autocomplete](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new)
- [Google Maps API 보안 권장사항](https://developers.google.com/maps/api-security-best-practices)
- [Google Maps Platform 가격 정책](https://developers.google.com/maps/billing-and-pricing/pricing)
