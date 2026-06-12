import { http, HttpResponse } from 'msw';
import { mockNotifications } from '../fixtures/mockData';
import { getMockUser } from './authHandlers';

export const notificationHandlers = [
  http.get('/api/notifications', () => {
    if (!getMockUser()) {
      return HttpResponse.json(
        { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    return HttpResponse.json(mockNotifications);
  }),
];
