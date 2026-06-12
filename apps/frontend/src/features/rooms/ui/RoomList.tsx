import { EmptyState } from '../../../shared/ui/EmptyState';
import { RoomSummary } from '../model/roomTypes';
import { RoomCard } from './RoomCard';

export function RoomList({ rooms }: { rooms: RoomSummary[] }) {
  if (rooms.length === 0) {
    return (
      <EmptyState
        title="검색 결과가 없습니다."
        description="지역, 날짜, 인원 조건을 바꿔 다시 검색해 보세요."
      />
    );
  }

  return (
    <div className="room-grid">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
