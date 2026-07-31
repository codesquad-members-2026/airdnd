import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  useHostRoomsQuery,
  useUpdateHostRoomStatusMutation,
} from '../../features/host/api/hostQueries';
import { HostRoomList } from '../../features/host/ui/HostRoomList';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';

// 상단 세그먼트 필터의 탭 키 — 전체 / 운영 중 / 비활성·대기(INACTIVE+승인 대기)
type FilterKey = 'all' | 'active' | 'inactive';

const filterMeta: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '운영 중' },
  { key: 'inactive', label: '비활성 · 대기' },
];

export function HostRoomsPage() {
  const hostRoomsQuery = useHostRoomsQuery();
  const statusMutation = useUpdateHostRoomStatusMutation();
  // 현재 보고 있는 필터 탭 (기본: 전체)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const rooms = hostRoomsQuery.data ?? [];
  const activeCount = rooms.filter((room) => room.status === 'ACTIVE').length;
  const inactiveCount = rooms.length - activeCount;

  // 탭별 카운트 — 세그먼트 배지에 표시
  const counts: Record<FilterKey, number> = {
    all: rooms.length,
    active: activeCount,
    inactive: inactiveCount,
  };

  // 선택된 탭에 맞게 거른 목록 ('비활성·대기'는 운영 중이 아닌 모든 상태)
  const filteredRooms = rooms.filter((room) => {
    if (activeFilter === 'active') return room.status === 'ACTIVE';
    if (activeFilter === 'inactive') return room.status !== 'ACTIVE';
    return true;
  });

  return (
    <section className="stack">
      <div className="page-head">
        <div className="page-heading">
          <p className="eyebrow">Host</p>
          <h1>호스트 숙소 관리</h1>
          <p className="reservation-intro">등록한 숙소를 관리하고 예약 현황을 확인하세요.</p>
        </div>
        <Link className="primary-button inline-action" to="/host/rooms/new">
          <Plus size={18} strokeWidth={2.4} aria-hidden />
          숙소 등록
        </Link>
      </div>

      {rooms.length > 0 ? (
        <div className="segmented" role="tablist" aria-label="숙소 상태 필터">
          {filterMeta.map(({ key, label }) => {
            const active = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`seg-tab${active ? ' active' : ''}`}
                onClick={() => setActiveFilter(key)}
              >
                {label}
                <span className="seg-tab__count">{counts[key]}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {hostRoomsQuery.isLoading ? <Loading message="호스트 숙소를 불러오는 중입니다." /> : null}
      {hostRoomsQuery.error ? <ErrorMessage error={hostRoomsQuery.error} /> : null}
      {statusMutation.error ? <ErrorMessage error={statusMutation.error} /> : null}
      {hostRoomsQuery.data ? (
        rooms.length > 0 && filteredRooms.length === 0 ? (
          <EmptyState
            title="해당 상태의 숙소가 없습니다."
            description="다른 필터를 선택해 보세요."
          />
        ) : (
          <HostRoomList
            rooms={filteredRooms}
            pendingRoomId={statusMutation.isPending ? statusMutation.variables?.roomId : undefined}
            onStatusChange={(roomId, status) => statusMutation.mutate({ roomId, status })}
          />
        )
      ) : null}
    </section>
  );
}
