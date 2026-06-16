export function formatCurrency(value: number) {
  if (!value) return '0';
  return value.toLocaleString('ko-KR');
}

/** 백엔드 @Digits(integer=10, fraction=2)에 맞춰 정수 최대 10자리로 제한 */
export function parseCurrencyInput(value: string) {
  const digits = value.replace(/[^\d]/g, '').slice(0, 10);
  return digits ? Number(digits) : 0;
}

export function formatKoreanMoney(value: number) {
  if (!value) return '0원';

  const units = [
    { value: 100000000, label: '억' },
    { value: 10000, label: '만' },
    { value: 1000, label: '천' },
    { value: 100, label: '백' },
    { value: 10, label: '십' },
  ];

  let rest = Math.floor(value);
  const parts: string[] = [];

  for (const unit of units) {
    const count = Math.floor(rest / unit.value);
    if (count > 0) {
      parts.push(`${count.toLocaleString('ko-KR')}${unit.label}`);
      rest %= unit.value;
    }
  }

  if (rest > 0) parts.push(`${rest}원`);
  else parts.push('원');

  return parts.join(' ');
}
