import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useHostRoomQuery,
  useHostRoomReservationCountsQuery,
  useHostRoomReservationsQuery,
} from '../../features/host/api/hostQueries';
import { HostReservationList } from '../../features/host/ui/HostReservationList';
import { ReservationStatusFilter } from '../../features/reservations/model/reservationTypes';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { InfiniteScrollSentinel } from '../../shared/ui/InfiniteScrollSentinel';

export function HostRoomReservationsPage() {
  const { roomId } = useParams();
  const parsedRoomId = roomId ? Number(roomId) : undefined;

  // 선택된 상태 탭이 어떤 커서 무한 쿼리를 돌릴지 결정한다.
  const [activeFilter, setActiveFilter] = useState<ReservationStatusFilter>('ALL');

  const roomQuery = useHostRoomQuery(parsedRoomId);
  const countsQuery = useHostRoomReservationCountsQuery(parsedRoomId);
  const reservationsQuery = useHostRoomReservationsQuery(parsedRoomId, activeFilter);

  const reservations = reservationsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section className="stack">
      <div className="page-heading">
        <Link className="ghost-button inline-action" to="/host/rooms">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          숙소 관리로 돌아가기
        </Link>
        <p className="eyebrow">Host</p>
        <h1>{roomQuery.data ? `${roomQuery.data.name} 예약 현황` : '예약 현황'}</h1>
        <p className="muted">이 숙소에 들어온 예약을 확인합니다.</p>
      </div>

      {roomQuery.error ? <ErrorMessage error={roomQuery.error} /> : null}
      {reservationsQuery.error ? <ErrorMessage error={reservationsQuery.error} /> : null}

      <HostReservationList
        reservations={reservations}
        counts={countsQuery.data}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        isLoading={reservationsQuery.isLoading}
      />

      <InfiniteScrollSentinel
        onReachEnd={() => reservationsQuery.fetchNextPage()}
        hasNext={reservationsQuery.hasNextPage}
        isFetching={reservationsQuery.isFetchingNextPage}
      />
    </section>
  );
}
