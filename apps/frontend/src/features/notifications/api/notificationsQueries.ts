import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationUnreadCount,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notificationsApi';
import type { Notification } from '../model/notificationTypes';

export const notificationQueryKeys = {
  list: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.list,
    queryFn: getNotifications,
  });
}

export function useNotificationUnreadCountQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount,
    queryFn: getNotificationUnreadCount,
  });
}

// 읽음 처리는 낙관적 업데이트로 즉시 반영하고, 실패 시 직전 캐시로 롤백한다.
// 목록 캐시와 백엔드 안읽음 카운트 캐시를 함께 갱신해 페이지·드롭다운·벨 뱃지를 일치시킨다.
export function useNotificationActions() {
  const queryClient = useQueryClient();

  const patchCache = (updater: (list: Notification[]) => Notification[]) =>
    queryClient.setQueryData<Notification[]>(notificationQueryKeys.list, (current) =>
      current ? updater(current) : current,
    );

  const patchCount = (updater: (count: number) => number) =>
    queryClient.setQueryData<number>(notificationQueryKeys.unreadCount, (current) =>
      typeof current === 'number' ? updater(current) : current,
    );

  // 목록·카운트 두 캐시를 함께 보존했다가, 실패 시 둘 다 되돌린다.
  const snapshot = async () => {
    await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list });
    await queryClient.cancelQueries({ queryKey: notificationQueryKeys.unreadCount });
    return {
      previousList: queryClient.getQueryData<Notification[]>(notificationQueryKeys.list),
      previousCount: queryClient.getQueryData<number>(notificationQueryKeys.unreadCount),
    };
  };

  const rollback = (context?: { previousList?: Notification[]; previousCount?: number }) => {
    if (context?.previousList) {
      queryClient.setQueryData(notificationQueryKeys.list, context.previousList);
    }
    if (context?.previousCount !== undefined) {
      queryClient.setQueryData(notificationQueryKeys.unreadCount, context.previousCount);
    }
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list });
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onMutate: async (id: number) => {
      const context = await snapshot();
      const wasUnread = (context.previousList ?? []).some((item) => item.id === id && !item.read);
      patchCache((list) =>
        list.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      if (wasUnread) {
        patchCount((count) => Math.max(0, count - 1));
      }
      return context;
    },
    onError: (_error, _id, context) => rollback(context),
    onSettled: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      const context = await snapshot();
      patchCache((list) => list.map((item) => ({ ...item, read: true })));
      patchCount(() => 0);
      return context;
    },
    onError: (_error, _vars, context) => rollback(context),
    onSettled: invalidate,
  });

  return {
    markRead: (id: number) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  };
}
