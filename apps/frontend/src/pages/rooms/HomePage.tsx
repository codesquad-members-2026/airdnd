import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../../features/rooms/ui/SearchBar';
import { RoomList } from '../../features/rooms/ui/RoomList';
import { useRoomListQuery } from '../../features/rooms/api/roomsQueries';
import { RoomSearchParams } from '../../features/rooms/model/roomTypes';
import { Loading } from '../../shared/ui/Loading';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { InfiniteScrollSentinel } from '../../shared/ui/InfiniteScrollSentinel';

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
  const roomsQuery = useRoomListQuery(params);
  const rooms = roomsQuery.data?.pages.flatMap((page) => page.items) ?? [];

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
        </div>
        <SearchBar defaultValue={params} onSearch={handleSearch} />
      </div>
      {roomsQuery.isLoading ? <Loading message="숙소 목록을 불러오는 중입니다." /> : null}
      {roomsQuery.error ? <ErrorMessage error={roomsQuery.error} /> : null}
      {roomsQuery.data ? (
        <>
          <RoomList rooms={rooms} />
          <InfiniteScrollSentinel
            onReachEnd={() => roomsQuery.fetchNextPage()}
            hasNext={roomsQuery.hasNextPage}
            isFetching={roomsQuery.isFetchingNextPage}
          />
        </>
      ) : null}
    </section>
  );
}
