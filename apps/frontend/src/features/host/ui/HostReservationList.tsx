import { CalendarRange, Users } from 'lucide-react';
import { formatCurrency, formatStayRange } from '../../../shared/lib/format';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { Loading } from '../../../shared/ui/Loading';
import { StatusBadge, StatusBadgeTone } from '../../../shared/ui/StatusBadge';
import { reservationStatusText } from '../../reservations/model/reservationStatus';
import {
  Reservation,
  ReservationCounts,
  ReservationStatus,
  ReservationStatusFilter,
} from '../../reservations/model/reservationTypes';

type HostReservationListProps = {
  // 서버가 activeFilter 로 이미 필터링·정렬한 한 묶음(여러 페이지를 평탄화한 결과).
  reservations: Reservation[];
  // 탭 배지에 표시할 전체 카운트(로딩 중이면 undefined).
  counts: ReservationCounts | undefined;
  activeFilter: ReservationStatusFilter;
  onFilterChange: (filter: ReservationStatusFilter) => void;
  // 현재 탭 첫 페이지 로딩 여부.
  isLoading: boolean;
};

// 호스트 예약 현황 전용 상태 톤 — 게스트 화면과 달리 취소를 빨강(danger)으로 또렷하게 보여준다.
// (공유 reservationStatusTone 은 게스트 목록에서 취소를 회색으로 흐리게 쓰므로 건드리지 않는다.)
const hostStatusTone: Record<ReservationStatus, StatusBadgeTone> = {
  CONFIRMED: 'success',
  PENDING: 'warning',
  CANCELLED: 'danger',
};

const filterMeta: { key: ReservationStatusFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'CONFIRMED', label: '확정' },
  { key: 'PENDING', label: '대기' },
  { key: 'CANCELLED', label: '취소' },
];

// 필터 키 → 카운트 요약의 해당 숫자.
function countFor(counts: ReservationCounts | undefined, key: ReservationStatusFilter): number | undefined {
  if (!counts) return undefined;
  switch (key) {
    case 'ALL':
      return counts.all;
    case 'CONFIRMED':
      return counts.confirmed;
    case 'PENDING':
      return counts.pending;
    case 'CANCELLED':
      return counts.cancelled;
  }
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const MONTH_LABEL = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function nightsBetween(checkIn: string, checkOut: string) {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(diff / MS_PER_DAY));
}

// 'YYYY-MM-DD' 를 타임존 영향 없이 월/일 칩 텍스트로 분해
function dateChip(value: string) {
  const [, month, day] = value.split('-');
  return { month: MONTH_LABEL[Number(month) - 1] ?? '', day: String(Number(day)) };
}

export function HostReservationList({
  reservations,
  counts,
  activeFilter,
  onFilterChange,
  isLoading,
}: HostReservationListProps) {
  // 이 숙소에 예약이 한 건도 없는 경우(전체 카운트 0)와, 단지 현재 탭만 비어 있는 경우를 구분한다.
  const roomHasNoReservations = counts?.all === 0;

  return (
    <div className="host-res">
      <div className="segmented" role="tablist" aria-label="예약 상태 필터">
        {filterMeta.map(({ key, label }) => {
          const active = activeFilter === key;
          const count = countFor(counts, key);
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`seg-tab${active ? ' active' : ''}`}
              onClick={() => onFilterChange(key)}
            >
              {label}
              {count !== undefined ? <span className="seg-tab__count">{count}</span> : null}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <Loading message="예약을 불러오는 중입니다." />
      ) : reservations.length === 0 ? (
        <EmptyState
          title={roomHasNoReservations ? '아직 예약이 없습니다.' : '해당 상태의 예약이 없습니다.'}
          description={
            roomHasNoReservations
              ? '이 숙소에 예약이 들어오면 이곳에서 확인할 수 있어요.'
              : '다른 상태를 선택해 보세요.'
          }
        />
      ) : (
        <ul className="host-res__list">
          {reservations.map((reservation) => {
            const nights = nightsBetween(reservation.checkIn, reservation.checkOut);
            const chip = dateChip(reservation.checkIn);
            const tone = hostStatusTone[reservation.status];

            return (
              <li key={reservation.id} className={`host-res-card host-res-card--${tone}`}>
                <div className="host-res-card__chip" aria-hidden>
                  <span className="host-res-card__chip-month">{chip.month}</span>
                  <span className="host-res-card__chip-day">{chip.day}</span>
                </div>

                <div className="host-res-card__info">
                  <p className="host-res-card__range">
                    <CalendarRange size={15} strokeWidth={1.9} aria-hidden />
                    {formatStayRange(reservation.checkIn, reservation.checkOut)}
                  </p>
                  <p className="host-res-card__meta">
                    <span>{nights}박</span>
                    <span className="host-res-card__dot" aria-hidden />
                    <span className="host-res-card__guests">
                      <Users size={14} strokeWidth={1.9} aria-hidden />
                      게스트 {reservation.guests}명
                    </span>
                  </p>
                </div>

                <div className="host-res-card__side">
                  <StatusBadge tone={tone}>{reservationStatusText[reservation.status]}</StatusBadge>
                  <strong className="host-res-card__price">
                    {formatCurrency(reservation.totalPrice)}
                  </strong>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
