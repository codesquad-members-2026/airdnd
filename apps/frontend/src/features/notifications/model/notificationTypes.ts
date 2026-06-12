import { z } from 'zod';

export const notificationSchema = z.object({
  id: z.number(),
  type: z.enum(['RESERVATION', 'HOST', 'SYSTEM']),
  title: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;
