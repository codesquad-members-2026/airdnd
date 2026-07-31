import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  WEEKDAY_LABELS,
  addMonths,
  formatDateSummary,
  getCalendarDays,
  toDateValue,
} from '../lib/calendar';

type CalendarPopoverProps = {
  activePanel: 'checkIn' | 'checkOut';
  month: Date;
  selectedCheckIn: Date | null;
  selectedCheckOut: Date | null;
  onMonthChange: (date: Date) => void;
  onSelectDate: (value: string) => void;
  isDateDisabled: (value: string) => boolean;
  isDateInRange: (value: string) => boolean;
  isDateSelected: (value: string) => boolean;
  /** 한 번에 보여줄 달 수 (기본 2개월) */
  monthsToShow?: number;
  /** 좁은 컨테이너(예: 예약 사이드바)용 1개월 컴팩트 레이아웃 */
  compact?: boolean;
};

export function CalendarPopover({
  activePanel,
  month,
  selectedCheckIn,
  selectedCheckOut,
  onMonthChange,
  onSelectDate,
  isDateDisabled,
  isDateInRange,
  isDateSelected,
  monthsToShow = 2,
  compact = false,
}: CalendarPopoverProps) {
  const months = Array.from({ length: monthsToShow }, (_, index) => addMonths(month, index));

  return (
    <div className={`search-popover calendar-popover${compact ? ' compact' : ''}`}>
      <div className="calendar-popover-header">
        <div>
          <strong>{activePanel === 'checkIn' ? '체크인 날짜 선택' : '체크아웃 날짜 선택'}</strong>
          <span>
            {selectedCheckIn ? formatDateSummary(toDateValue(selectedCheckIn), '체크인') : '체크인'} -{' '}
            {selectedCheckOut ? formatDateSummary(toDateValue(selectedCheckOut), '체크아웃') : '체크아웃'}
          </span>
        </div>
        <div className="calendar-nav">
          <button type="button" aria-label="이전 달" onClick={() => onMonthChange(addMonths(month, -1))}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="다음 달" onClick={() => onMonthChange(addMonths(month, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="calendar-months">
        {months.map((monthStart) => (
          <section className="calendar-month" key={toDateValue(monthStart)}>
            <h3>
              {new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: 'long',
              }).format(monthStart)}
            </h3>
            <div className="calendar-weekdays" aria-hidden="true">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {getCalendarDays(monthStart).map((date) => {
                const value = toDateValue(date);
                const isOutsideMonth = date.getMonth() !== monthStart.getMonth();

                return (
                  <button
                    type="button"
                    className={[
                      'calendar-day',
                      isOutsideMonth ? 'outside' : '',
                      isDateSelected(value) ? 'selected' : '',
                      isDateInRange(value) ? 'in-range' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    key={value}
                    disabled={isOutsideMonth || isDateDisabled(value)}
                    onClick={() => onSelectDate(value)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
