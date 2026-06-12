import { request } from '../../../shared/api/httpClient';
import { Notification, notificationSchema } from '../model/notificationTypes';

export async function getNotifications() {
  const data = await request<Notification[]>('/api/notifications');
  return notificationSchema.array().parse(data);
}
