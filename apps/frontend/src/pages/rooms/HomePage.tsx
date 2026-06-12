import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../../features/rooms/ui/SearchBar';
import { RoomList } from '../../features/rooms/ui/RoomList';
import { useRoomsQuery } from '../../features/rooms/api/roomsQueries';
import { RoomSearchParams } from '../../features/rooms/model/roomTypes';
import { Loading } from '../../shared/ui/Loading';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params: RoomSearchParams = {
    region: searchParams.get('region') ?? '',
    checkIn: searchParams.get('checkIn') ?? '',
    checkOut: searchParams.get('checkOut') ?? '',
    guests: Number(searchParams.get('guests') ?? '1'),
    adults: Number(searchParams.get('adults') ?? searchParams.get('guests') ?? '1'),
    children: Number(searchParams.get('children') ?? '0'),
    infants: Number(searchParams.get('infants') ?? '0'),
    minPrice: Number(searchParams.get('minPrice') ?? '0') || undefined,
    maxPrice: Number(searchParams.get('maxPrice') ?? '0') || undefined,
    allowsPets: searchParams.get('allowsPets') === 'true' || undefined,
  };
  const roomsQuery = useRoomsQuery(params);

  function handleSearch(nextParams: RoomSearchParams) {
    const next = new URLSearchParams();
    Object.entries(nextParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        next.set(key, String(value));
      }
    });
    setSearchParams(next);
  }

  return (
    <section className="stack">
      <div className="home-hero">
        <div className="page-heading">
          <p className="eyebrow">AirDnD</p>
          <h1>원하는 숙소를 검색하고 예약하세요.</h1>
          <p className="muted">검증 가능한 mock API와 실제 API 계약을 바탕으로 동작하는 숙소 예약 UI입니다.</p>
        </div>
        <div className="hero-meta" aria-label="서비스 강점">
          <span>실시간 예약 흐름</span>
          <span>호스트 관리</span>
          <span>OAuth 준비</span>
          <span>지도 탐색 확장 가능</span>
        </div>
        <SearchBar defaultValue={params} onSearch={handleSearch} />
      </div>
      {roomsQuery.isLoading ? <Loading message="숙소 목록을 불러오는 중입니다." /> : null}
      {roomsQuery.error ? <ErrorMessage error={roomsQuery.error} /> : null}
      {roomsQuery.data ? <RoomList rooms={roomsQuery.data} /> : null}
    </section>
  );
}
