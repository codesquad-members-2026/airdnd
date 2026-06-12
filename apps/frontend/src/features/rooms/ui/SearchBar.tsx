import { FormEvent, MouseEvent, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, PawPrint, Plus, Search } from 'lucide-react';
import { formatCurrency } from '../../../shared/lib/format';
import { RoomSearchParams } from '../model/roomTypes';

type SearchBarProps = {
  defaultValue: RoomSearchParams;
  onSearch: (params: RoomSearchParams) => void;
};

type OccupancyKey = 'adults' | 'children' | 'infants';
type OccupancyRule = {
  title: string;
  description: string;
  min: number;
  max?: number;
};
type OpenPanel = 'checkIn' | 'checkOut' | 'price' | 'occupancy' | null;

const PRICE_MIN = 0;
const PRICE_MAX = 500000;
const PRICE_STEP = 10000;
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const occupancyLabels: Record<OccupancyKey, OccupancyRule> = {
  adults: { title: '성인', description: '만 13세 이상, 최대 8명', min: 1, max: 8 },
  children: { title: '아동', description: '만 2-12세, 최대 8명', min: 0, max: 8 },
  infants: { title: '유아', description: '만 2세 미만, 최대 8명', min: 0, max: 8 },
};

function clampOccupancyValue(key: OccupancyKey, value: number) {
  const rule = occupancyLabels[key];
  return Math.min(rule.max ?? Number.POSITIVE_INFINITY, Math.max(rule.min, value));
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDateSummary(value: string, fallback: string) {
  const date = parseDateValue(value);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getCalendarDays(monthStart: Date) {
  const start = new Date(monthStart);
  start.setDate(1 - start.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function SearchBar({ defaultValue, onSearch }: SearchBarProps) {
  const [region, setRegion] = useState(defaultValue.region ?? '');
  const [checkIn, setCheckIn] = useState(defaultValue.checkIn ?? '');
  const [checkOut, setCheckOut] = useState(defaultValue.checkOut ?? '');
  const [calendarMonth, setCalendarMonth] = useState(
    getMonthStart(parseDateValue(defaultValue.checkIn ?? '') ?? new Date()),
  );
  const [adults, setAdults] = useState(
    clampOccupancyValue('adults', defaultValue.adults ?? defaultValue.guests ?? 1),
  );
  const [children, setChildren] = useState(clampOccupancyValue('children', defaultValue.children ?? 0));
  const [infants, setInfants] = useState(clampOccupancyValue('infants', defaultValue.infants ?? 0));
  const [minPrice, setMinPrice] = useState(defaultValue.minPrice ?? PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(defaultValue.maxPrice ?? PRICE_MAX);
  const [allowsPets, setAllowsPets] = useState(defaultValue.allowsPets ?? false);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  const stayGuests = adults + children;
  const hasPriceFilter = minPrice > PRICE_MIN || maxPrice < PRICE_MAX;
  const selectedCheckIn = parseDateValue(checkIn);
  const selectedCheckOut = parseDateValue(checkOut);
  const occupancySummary = [
    `${stayGuests}명`,
    infants > 0 ? `유아 ${infants}명` : null,
    allowsPets ? '반려동물' : null,
  ]
    .filter(Boolean)
    .join(', ');
  const priceSummary = hasPriceFilter
    ? `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
    : '가격 범위';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch({
      region,
      checkIn,
      checkOut,
      adults,
      children,
      infants,
      guests: stayGuests,
      minPrice: hasPriceFilter ? minPrice : undefined,
      maxPrice: hasPriceFilter ? maxPrice : undefined,
      allowsPets: allowsPets || undefined,
    });
    setOpenPanel(null);
  }

  function updateOccupancy(key: OccupancyKey, direction: 1 | -1) {
    const setters = {
      adults: setAdults,
      children: setChildren,
      infants: setInfants,
    };
    const values = {
      adults,
      children,
      infants,
    };
    const nextValue = clampOccupancyValue(key, values[key] + direction);
    setters[key](nextValue);
  }

  function updateMinPrice(nextValue: number) {
    setMinPrice(Math.min(nextValue, maxPrice - PRICE_STEP));
  }

  function updateMaxPrice(nextValue: number) {
    setMaxPrice(Math.max(nextValue, minPrice + PRICE_STEP));
  }

  function updatePriceInput(key: 'min' | 'max', value: string) {
    const parsedValue = Number(value);
    const boundedValue = Math.min(Math.max(parsedValue, PRICE_MIN), PRICE_MAX);

    if (key === 'min') {
      updateMinPrice(boundedValue);
      return;
    }

    updateMaxPrice(boundedValue);
  }

  function resetPrice() {
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
  }

  function togglePanel(panel: Exclude<OpenPanel, null>) {
    setOpenPanel(openPanel === panel ? null : panel);
  }

  function selectDate(value: string) {
    if (openPanel === 'checkIn') {
      setCheckIn(value);

      if (checkOut && value >= checkOut) {
        setCheckOut('');
      }

      setOpenPanel('checkOut');
      return;
    }

    if (openPanel === 'checkOut') {
      if (checkIn && value <= checkIn) {
        return;
      }

      setCheckOut(value);
      setOpenPanel(null);
    }
  }

  function isDateSelected(value: string) {
    return value === checkIn || value === checkOut;
  }

  function isDateInRange(value: string) {
    return Boolean(checkIn && checkOut && value > checkIn && value < checkOut);
  }

  function isDateDisabled(value: string) {
    return openPanel === 'checkOut' && Boolean(checkIn && value <= checkIn);
  }

  function updatePriceFromTrackPosition(clientX: number, trackElement: HTMLElement) {
    const rect = trackElement.getBoundingClientRect();
    const rawValue = ((clientX - rect.left) / rect.width) * PRICE_MAX;
    const nextValue = Math.round(rawValue / PRICE_STEP) * PRICE_STEP;
    const boundedValue = Math.min(Math.max(nextValue, PRICE_MIN), PRICE_MAX);

    if (!hasPriceFilter) {
      updateMinPrice(boundedValue);
      return;
    }

    const distanceToMin = Math.abs(boundedValue - minPrice);
    const distanceToMax = Math.abs(boundedValue - maxPrice);

    if (distanceToMin <= distanceToMax) {
      updateMinPrice(boundedValue);
      return;
    }

    updateMaxPrice(boundedValue);
  }

  function handlePriceTrackClick(event: MouseEvent<HTMLElement>) {
    updatePriceFromTrackPosition(event.clientX, event.currentTarget);
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <label className="search-field">
        지역
        <input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="서울" />
      </label>
      <div className="search-field dropdown-field date-field">
        <span>체크인</span>
        <button
          className="search-select"
          type="button"
          aria-expanded={openPanel === 'checkIn'}
          onClick={() => togglePanel('checkIn')}
        >
          {formatDateSummary(checkIn, '날짜 선택')}
        </button>
        {openPanel === 'checkIn' ? (
          <CalendarPopover
            activePanel={openPanel}
            month={calendarMonth}
            selectedCheckIn={selectedCheckIn}
            selectedCheckOut={selectedCheckOut}
            onMonthChange={setCalendarMonth}
            onSelectDate={selectDate}
            isDateDisabled={isDateDisabled}
            isDateInRange={isDateInRange}
            isDateSelected={isDateSelected}
          />
        ) : null}
      </div>
      <div className="search-field dropdown-field date-field">
        <span>체크아웃</span>
        <button
          className="search-select"
          type="button"
          aria-expanded={openPanel === 'checkOut'}
          onClick={() => togglePanel('checkOut')}
        >
          {formatDateSummary(checkOut, '날짜 선택')}
        </button>
        {openPanel === 'checkOut' ? (
          <CalendarPopover
            activePanel={openPanel}
            month={calendarMonth}
            selectedCheckIn={selectedCheckIn}
            selectedCheckOut={selectedCheckOut}
            onMonthChange={setCalendarMonth}
            onSelectDate={selectDate}
            isDateDisabled={isDateDisabled}
            isDateInRange={isDateInRange}
            isDateSelected={isDateSelected}
          />
        ) : null}
      </div>
      <div className="search-field dropdown-field">
        <span>가격</span>
        <button
          className="search-select"
          type="button"
          aria-expanded={openPanel === 'price'}
          onClick={() => togglePanel('price')}
        >
          {priceSummary}
        </button>
        {openPanel === 'price' ? (
          <div className="search-popover price-popover">
            <div className="price-popover-header">
              <div>
                <strong>가격 범위</strong>
                <p>평균 1박 요금은 {formatCurrency(165556)} 입니다.</p>
              </div>
              <span>{priceSummary}</span>
            </div>
            <div className="price-distribution" aria-hidden="true">
              <svg viewBox="0 0 390 132" role="presentation">
                <path className="price-distribution-muted" d="M22 105 C54 105 69 101 92 100 C118 99 128 91 140 75 C150 60 158 76 171 57 C183 40 183 10 190 10 C197 10 199 45 210 58 C221 71 228 66 235 86 C243 108 260 108 282 103 C299 99 312 106 332 108 C354 111 369 112 379 112" />
                <path className="price-distribution-active" d="M22 105 C54 105 69 101 92 100 C118 99 128 91 140 75 C150 60 158 76 171 57 C183 40 183 10 190 10 C197 10 199 45 210 58 C221 71 228 66 235 86 C243 108 260 108 282 103 C299 99 312 106 332 108 C354 111 369 112 379 112 L379 112 L22 112 Z" />
                <path className="price-distribution-line" d="M22 112 H379" />
              </svg>
            </div>
            <div
              className="range-slider"
              aria-label="가격 범위"
            >
              <button
                className="range-track-click-target"
                type="button"
                aria-label="가격 범위 선택"
                onClick={handlePriceTrackClick}
              />
              <div
                className="range-track-active"
                style={{
                  left: `${(minPrice / PRICE_MAX) * 100}%`,
                  right: `${100 - (maxPrice / PRICE_MAX) * 100}%`,
                }}
              />
              <input
                aria-label="최소 가격"
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={minPrice}
                onChange={(event) => updateMinPrice(Number(event.target.value))}
              />
              <input
                aria-label="최대 가격"
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={maxPrice}
                onChange={(event) => updateMaxPrice(Number(event.target.value))}
              />
            </div>
            <div className="price-input-grid">
              <label>
                최소 가격
                <input
                  type="number"
                  min={PRICE_MIN}
                  max={PRICE_MAX - PRICE_STEP}
                  step={PRICE_STEP}
                  value={minPrice}
                  onChange={(event) => updatePriceInput('min', event.target.value)}
                />
              </label>
              <label>
                최대 가격
                <input
                  type="number"
                  min={PRICE_MIN + PRICE_STEP}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={maxPrice}
                  onChange={(event) => updatePriceInput('max', event.target.value)}
                />
              </label>
            </div>
            <button className="ghost-button" type="button" onClick={resetPrice}>
              가격 초기화
            </button>
          </div>
        ) : null}
      </div>
      <div className="search-field dropdown-field">
        <span>인원</span>
        <button
          className="search-select"
          type="button"
          aria-expanded={openPanel === 'occupancy'}
          onClick={() => togglePanel('occupancy')}
        >
          {occupancySummary}
        </button>
        {openPanel === 'occupancy' ? (
          <div className="search-popover occupancy-popover">
            {(['adults', 'children', 'infants'] as OccupancyKey[]).map((key) => (
              <div className="occupancy-row" key={key}>
                <div>
                  <strong>{occupancyLabels[key].title}</strong>
                  <p className="muted">{occupancyLabels[key].description}</p>
                </div>
                <div className="stepper">
                  <button
                    type="button"
                    className="stepper-button"
                    aria-label={`${occupancyLabels[key].title} 감소`}
                    onClick={() => updateOccupancy(key, -1)}
                    disabled={{ adults, children, infants }[key] <= occupancyLabels[key].min}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{{ adults, children, infants }[key]}</span>
                  <button
                    type="button"
                    className="stepper-button"
                    aria-label={`${occupancyLabels[key].title} 증가`}
                    onClick={() => updateOccupancy(key, 1)}
                    disabled={
                      occupancyLabels[key].max !== undefined &&
                      { adults, children, infants }[key] >= occupancyLabels[key].max
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
            <label className="checkbox-row occupancy-filter-row">
              <input
                type="checkbox"
                checked={allowsPets}
                onChange={(event) => setAllowsPets(event.target.checked)}
              />
              <span>
                <strong>반려동물 동반 가능</strong>
                <small>반려동물 허용 숙소만 검색합니다.</small>
              </span>
              <PawPrint size={18} />
            </label>
          </div>
        ) : null}
      </div>
      <button className="primary-button search-button" type="submit">
        <Search size={18} />
        검색
      </button>
    </form>
  );
}

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
};

function CalendarPopover({
  activePanel,
  month,
  selectedCheckIn,
  selectedCheckOut,
  onMonthChange,
  onSelectDate,
  isDateDisabled,
  isDateInRange,
  isDateSelected,
}: CalendarPopoverProps) {
  const months = [month, addMonths(month, 1)];

  return (
    <div className="search-popover calendar-popover">
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
