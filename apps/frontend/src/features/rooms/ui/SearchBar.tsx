import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { Minus, PawPrint, Plus, Search } from 'lucide-react';
import { formatCurrency } from '../../../shared/lib/format';
import { formatDateSummary, getMonthStart, parseDateValue, toDateValue } from '../../../shared/lib/calendar';
import { CalendarPopover } from '../../../shared/ui/CalendarPopover';
import { RoomSearchParams } from '../model/roomTypes';

type SearchBarProps = {
  defaultValue: RoomSearchParams;
  onSearch: (params: RoomSearchParams) => void;
  // 헤더 등 좁은 영역에 들어가는 축소형 검색바(높이/폰트 축소). 지도 페이지 헤더에서 사용.
  compact?: boolean;
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
// 가격 분포를 막대 히스토그램으로 표현하기 위한 더미 분포(우측으로 꼬리가 긴 형태)
const PRICE_HISTOGRAM_BUCKETS = 34;
const PRICE_HISTOGRAM = Array.from({ length: PRICE_HISTOGRAM_BUCKETS }, (_, index) => {
  const position = index / (PRICE_HISTOGRAM_BUCKETS - 1);
  const peak = Math.exp(-(((position - 0.26) / 0.16) ** 2));
  const tail = Math.exp(-(((position - 0.58) / 0.36) ** 2)) * 0.32;
  return peak + tail;
});
const PRICE_HISTOGRAM_MAX = Math.max(...PRICE_HISTOGRAM);

// 성인 + 아동 합계 상한 (백엔드 RoomSearchRequestDTO 의 guests @Max(8) 와 일치).
// 유아(infants)는 인원 수에 포함되지 않고 별도 필터로만 사용됩니다.
const MAX_STAY_GUESTS = 8;

const occupancyLabels: Record<OccupancyKey, OccupancyRule> = {
  adults: { title: '성인', description: '만 13세 이상 · 성인·아동 합산 최대 8명', min: 1, max: 8 },
  children: { title: '아동', description: '만 2-12세 · 성인·아동 합산 최대 8명', min: 0, max: 8 },
  infants: { title: '유아', description: '만 2세 미만, 최대 8명', min: 0, max: 8 },
};

function clampOccupancyValue(key: OccupancyKey, value: number) {
  const rule = occupancyLabels[key];
  return Math.min(rule.max ?? Number.POSITIVE_INFINITY, Math.max(rule.min, value));
}

export function SearchBar({ defaultValue, onSearch, compact = false }: SearchBarProps) {
  const [region, setRegion] = useState(defaultValue.region ?? '');
  const [checkIn, setCheckIn] = useState(defaultValue.checkIn ?? '');
  const [checkOut, setCheckOut] = useState(defaultValue.checkOut ?? '');
  const [calendarMonth, setCalendarMonth] = useState(
    getMonthStart(parseDateValue(defaultValue.checkIn ?? '') ?? new Date()),
  );
  const initialAdults = clampOccupancyValue('adults', defaultValue.adults ?? defaultValue.guests ?? 1);
  const [adults, setAdults] = useState(initialAdults);
  // 성인 + 아동 합계가 8을 넘지 않도록 초기값(예: URL 파라미터)도 남은 인원으로 제한합니다.
  const [children, setChildren] = useState(
    Math.min(clampOccupancyValue('children', defaultValue.children ?? 0), MAX_STAY_GUESTS - initialAdults),
  );
  const [infants, setInfants] = useState(clampOccupancyValue('infants', defaultValue.infants ?? 0));
  const [minPrice, setMinPrice] = useState(defaultValue.minPrice ?? PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(defaultValue.maxPrice ?? PRICE_MAX);
  const [allowsPets, setAllowsPets] = useState(defaultValue.allowsPets ?? false);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const todayValue = toDateValue(new Date());
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

  useEffect(() => {
    if (!openPanel) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenPanel(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openPanel]);

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

  function canIncrementOccupancy(key: OccupancyKey) {
    const rule = occupancyLabels[key];
    const current = { adults, children, infants }[key];
    if (rule.max !== undefined && current >= rule.max) {
      return false;
    }
    // 성인 + 아동 합계는 8명을 넘을 수 없습니다(유아는 인원 수에 포함되지 않음).
    if ((key === 'adults' || key === 'children') && stayGuests >= MAX_STAY_GUESTS) {
      return false;
    }
    return true;
  }

  function updateOccupancy(key: OccupancyKey, direction: 1 | -1) {
    if (direction === 1 && !canIncrementOccupancy(key)) {
      return;
    }
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
    if (value < todayValue) return true;
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
    <form className={`search-bar${compact ? ' search-bar--compact' : ''}`} onSubmit={handleSubmit} ref={formRef}>
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
            <div className="price-histogram" aria-hidden="true">
              {PRICE_HISTOGRAM.map((value, index) => {
                const bucketPrice = (index / (PRICE_HISTOGRAM_BUCKETS - 1)) * PRICE_MAX;
                const isActive = bucketPrice >= minPrice && bucketPrice <= maxPrice;

                return (
                  <span
                    key={index}
                    className={`price-histogram-bar${isActive ? ' active' : ''}`}
                    style={{ height: `${Math.max((value / PRICE_HISTOGRAM_MAX) * 100, 8)}%` }}
                  />
                );
              })}
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
                    disabled={!canIncrementOccupancy(key)}
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
