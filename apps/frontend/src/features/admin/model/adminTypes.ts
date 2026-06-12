import { z } from 'zod';
import { hostRoomSchema } from '../../host/model/hostRoomTypes';
import { reservationSchema } from '../../reservations/model/reservationTypes';
import { userSchema } from '../../auth/model/authTypes';

export const adminDashboardSchema = z.object({
  pendingRooms: z.number(),
  activeUsers: z.number(),
  reservationsToday: z.number(),
  waitQueueSize: z.number(),
});

export type AdminDashboard = z.infer<typeof adminDashboardSchema>;

export const adminUserSchema = userSchema.extend({
  reservationCount: z.number(),
  joinedAt: z.string(),
  status: z.enum(['ACTIVE', 'BLOCKED']),
});

export const waitlistStatusSchema = z.enum(['OPEN', 'PAUSED', 'CLOSED']);

export const waitlistSnapshotSchema = z.object({
  status: waitlistStatusSchema,
  waitingUsers: z.number(),
  averageWaitMinutes: z.number(),
  admissionRatePerMinute: z.number(),
  updatedAt: z.string(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;
export type WaitlistSnapshot = z.infer<typeof waitlistSnapshotSchema>;
export const adminRoomReviewSchema = hostRoomSchema;
export const adminReservationSchema = reservationSchema;
export type AdminRoomReview = z.infer<typeof adminRoomReviewSchema>;
export type AdminReservation = z.infer<typeof adminReservationSchema>;
