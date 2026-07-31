export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateValue(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function formatDateSummary(value: string, fallback: string) {
  const date = parseDateValue(value);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

/**
 * [checkInValue, checkOutValue) 구간의 '점유된 밤' 날짜 값들을 반환한다.
 * 체크아웃 당일은 비어 있는 것으로 보므로 제외한다(턴오버 가능).
 */
export function eachNightValue(checkInValue: string, checkOutValue: string) {
  const start = parseDateValue(checkInValue);
  const end = parseDateValue(checkOutValue);
  if (!start || !end) return [];

  const nights: string[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    nights.push(toDateValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return nights;
}

export function getCalendarDays(monthStart: Date) {
  const start = new Date(monthStart);
  start.setDate(1 - start.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}
