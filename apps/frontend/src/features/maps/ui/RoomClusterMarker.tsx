import { formatCurrencyShort } from '../../../shared/lib/format';

interface RoomClusterMarkerProps {
  count: number;
  min: number;
  max: number;
}

// 줌 아웃 시 가까운 숙소들을 묶어 보여주는 클러스터 핀(Claude Design 핸드오프).
export function RoomClusterMarker({ count, min, max }: RoomClusterMarkerProps) {
  return (
    <div className="cluster" aria-label={`숙소 ${count}곳`}>
      <span className="cluster__count">
        <span className="cluster__dot" />
        {count}곳
      </span>
      <span className="cluster__range">
        {formatCurrencyShort(min)}–{formatCurrencyShort(max)}
      </span>
    </div>
  );
}
