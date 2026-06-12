import { http, HttpResponse } from 'msw';
import { User } from '../../features/auth/model/authTypes';
import { mockUsers } from '../fixtures/mockData';

// 개발용 목 세션 상태.
// VITE_MOCK_ROLE(GUEST | HOST | ADMIN)로 초기 로그인 상태를 지정할 수 있고, 미설정 시 비로그인입니다.
// e2e(Playwright)는 이 값을 설정하지 않으므로 비로그인 기본 동작이 그대로 유지됩니다.
function seedMockUser(): User | null {
  const role = import.meta.env.VITE_MOCK_ROLE as User['role'] | undefined;
  return role && mockUsers[role] ? mockUsers[role] : null;
}

let currentMockUser: User | null = seedMockUser();

export function getMockUser(): User | null {
  return currentMockUser;
}

export const authHandlers = [
  http.get('/api/auth/me', () => HttpResponse.json(getMockUser())),
  http.post('/api/auth/logout', () => {
    currentMockUser = null;
    return new HttpResponse(null, { status: 204 });
  }),
  http.post('/api/members/me/host-activation', () => {
    if (!currentMockUser) {
      return HttpResponse.json(
        { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    // 백엔드 MemberService와 동일하게 GUEST만 승격을 허용합니다(ErrorCode.UNAUTHORIZED_ACTION).
    if (currentMockUser.role !== 'GUEST') {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED_ACTION', message: '권한이 없는 요청은 수행할 수 없습니다.' },
        { status: 401 },
      );
    }

    // 동일 회원의 role만 HOST로 변경 (백엔드 세션 재인증과 동일한 결과).
    currentMockUser = { ...currentMockUser, role: 'HOST' };
    return HttpResponse.json(currentMockUser);
  }),
];
