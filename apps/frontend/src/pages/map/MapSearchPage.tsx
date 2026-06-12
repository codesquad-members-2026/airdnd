import { Link, useSearchParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useRoomsQuery } from '../../features/rooms/api/roomsQueries';
import { SearchBar } from '../../features/rooms/ui/SearchBar';
import { RoomReviewBadge } from '../../features/reviews/ui/RoomReviewBadge';
import { RoomSearchParams } from '../../features/rooms/model/roomTypes';
import { formatCurrency } from '../../shared/lib/format';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';

export function MapSearchPage() {
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
      <div className="page-heading">
        <p className="eyebrow">Map Search</p>
        <h1>지도 기반 숙소 탐색</h1>
        <p className="muted">실제 지도 API 연동 전, 검색 결과와 지도 패널의 정보 구조를 검증합니다.</p>
      </div>
      <SearchBar defaultValue={params} onSearch={handleSearch} />
      {roomsQuery.isLoading ? <Loading message="지도 검색 결과를 불러오는 중입니다." /> : null}
      {roomsQuery.error ? <ErrorMessage error={roomsQuery.error} /> : null}
      {roomsQuery.data ? (
        <div className="map-layout">
          <div className="list-stack">
            {roomsQuery.data.map((room) => (
              <Link className="map-result-card" to={`/rooms/${room.id}`} key={room.id}>
                <img src={room.imageUrl} alt={`${room.name} 대표 이미지`} />
                <div>
                  <h2>{room.name}</h2>
                  <p className="muted">{room.address}</p>
                  <p className="card-meta">
                    <RoomReviewBadge roomId={room.id} showReviewCount={false} /> ·{' '}
                    {formatCurrency(room.pricePerNight)} / 박
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="map-panel" aria-label="지도 placeholder">
            {roomsQuery.data.map((room, index) => (
              <span
                className="map-marker"
                style={{ left: `${24 + index * 23}%`, top: `${30 + index * 16}%` }}
                key={room.id}
              >
                <MapPin size={16} />
                {formatCurrency(room.pricePerNight)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
