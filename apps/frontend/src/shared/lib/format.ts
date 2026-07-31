export function formatCurrency(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

// 클러스터 가격 범위용 짧은 표기 (예: 83000 → ₩83K)
export function formatCurrencyShort(value: number) {
  if (value >= 1000) {
    return `₩${Math.round(value / 1000)}K`;
  }
  return `₩${value}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

// 최근이면 상대 시간(방금 전 / N분 전 / N시간 전 / N일 전), 일주일 넘으면 절대 날짜
export function formatRelativeTime(value: string) {
  const target = new Date(value).getTime();
  const diffMs = Date.now() - target;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return '방금 전';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}일 전`;
  return formatDate(value);
}

// 체크인–체크아웃을 한 줄로 압축 표기 (예: 2026년 7월 4일 – 6일)
export function formatStayRange(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const startText = `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일`;
  if (start.getFullYear() !== end.getFullYear()) {
    return `${startText} – ${end.getFullYear()}년 ${end.getMonth() + 1}월 ${end.getDate()}일`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${startText} – ${end.getMonth() + 1}월 ${end.getDate()}일`;
  }
  return `${startText} – ${end.getDate()}일`;
}
