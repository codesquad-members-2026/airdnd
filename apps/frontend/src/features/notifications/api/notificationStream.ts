import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '../../../shared/config/env';
import { notificationQueryKeys } from './notificationsQueries';

// 서버가 새 알림을 푸시(SSE)하면 알림 캐시를 무효화한다.
// 무효화하면 목록·안읽음 카운트 쿼리가 자동으로 다시 조회되어, 새로고침 없이 벨/뱃지가 갱신된다.
// 세션 쿠키 인증이므로 withCredentials 만으로 인증이 실리고(별도 토큰 불필요),
// 연결이 끊겨도 EventSource 가 자동 재연결한다.
export function useNotificationStream(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const source = new EventSource(`${env.apiBaseUrl}/api/notifications/stream`, {
      withCredentials: true,
    });

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount });
    };

    // 백엔드가 보내는 'notification' 이벤트만 구독한다('connect'는 연결 확인용).
    source.addEventListener('notification', refresh);

    return () => {
      source.removeEventListener('notification', refresh);
      source.close();
    };
  }, [enabled, queryClient]);
}
