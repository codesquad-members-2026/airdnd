import { useQuery } from '@tanstack/react-query';
import { getNotifications } from './notificationsApi';

export const notificationQueryKeys = {
  list: ['notifications'] as const,
};

export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.list,
    queryFn: getNotifications,
  });
}
