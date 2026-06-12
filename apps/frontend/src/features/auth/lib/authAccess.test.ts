import { describe, expect, it } from 'vitest';
import { canAccessAdmin, canAccessHost, getRoleLabel } from './authAccess';

describe('authAccess', () => {
  it('호스트와 관리자만 호스트 관리에 접근할 수 있다', () => {
    expect(canAccessHost('GUEST')).toBe(false);
    expect(canAccessHost('HOST')).toBe(true);
    expect(canAccessHost('ADMIN')).toBe(true);
  });

  it('관리자만 관리자 기능에 접근할 수 있다', () => {
    expect(canAccessAdmin('GUEST')).toBe(false);
    expect(canAccessAdmin('HOST')).toBe(false);
    expect(canAccessAdmin('ADMIN')).toBe(true);
  });

  it('역할을 사용자용 한글 이름으로 변환한다', () => {
    expect(getRoleLabel('GUEST')).toBe('게스트');
    expect(getRoleLabel('HOST')).toBe('호스트');
    expect(getRoleLabel('ADMIN')).toBe('관리자');
  });
});
