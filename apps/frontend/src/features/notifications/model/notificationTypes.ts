import { z } from 'zod';

export const notificationSchema = z.object({
  id: z.number(),
  type: z.enum(['RESERVATION', 'HOST', 'SYSTEM', 'REVIEW']),
  content: z.string(),
  redirectUrl: z.string().nullable(),
  read: z.boolean(),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

// 안읽음 개수는 백엔드가 직접 세어 내려준다(GET /api/notifications/unread-count).
export const unreadCountSchema = z.object({
  count: z.number(),
});
