import { beforeEach, describe, expect, test } from 'vitest';
import { consumeAuthReturnTo, saveAuthReturnTo, toInternalPath } from './authRedirect';

describe('OAuth 로그인 복귀 경로', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test('내부 경로의 검색 조건과 해시를 유지한다', () => {
    expect(
      toInternalPath({
        pathname: '/rooms/101',
        search: '?guests=2',
        hash: '#reservation',
      }),
    ).toBe('/rooms/101?guests=2#reservation');
  });

  test('외부 URL 형태는 홈 경로로 대체한다', () => {
    expect(toInternalPath({ pathname: '//malicious.example' })).toBe('/');
    saveAuthReturnTo('https://malicious.example');
    expect(consumeAuthReturnTo()).toBe('/');
  });

  test('저장한 경로는 한 번만 소비한다', () => {
    saveAuthReturnTo('/reservations');
    expect(consumeAuthReturnTo()).toBe('/reservations');
    expect(consumeAuthReturnTo()).toBe('/');
  });
});
