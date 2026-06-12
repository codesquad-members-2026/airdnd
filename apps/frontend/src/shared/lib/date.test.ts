import { describe, expect, it } from 'vitest';
import { getStayNights } from './date';

describe('getStayNights', () => {
  it('체크인과 체크아웃 사이의 숙박일을 계산한다', () => {
    expect(getStayNights('2026-07-10', '2026-07-12')).toBe(2);
  });

  it('체크아웃이 체크인보다 빠르면 0을 반환한다', () => {
    expect(getStayNights('2026-07-12', '2026-07-10')).toBe(0);
  });
});
