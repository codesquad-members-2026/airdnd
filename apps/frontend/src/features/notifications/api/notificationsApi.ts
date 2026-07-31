import { request } from '../../../shared/api/httpClient';
import { Notification, notificationSchema, unreadCountSchema } from '../model/notificationTypes';

export async function getNotifications() {
  const data = await request<Notification[]>('/api/notifications');
  return notificationSchema.array().parse(data);
}

export async function getNotificationUnreadCount() {
  const data = await request<{ count: number }>('/api/notifications/unread-count');
  return unreadCountSchema.parse(data).count;
}

export async function markNotificationRead(id: number) {
  await request<void>(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  await request<void>('/api/notifications/read-all', { method: 'PATCH' });
}
