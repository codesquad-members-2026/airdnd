import { request } from '../../../shared/api/httpClient';
import {
  AdminDashboard,
  AdminReservation,
  AdminRoomReview,
  AdminUser,
  WaitlistSnapshot,
  adminDashboardSchema,
  adminReservationSchema,
  adminRoomReviewSchema,
  adminUserSchema,
  waitlistSnapshotSchema,
} from '../model/adminTypes';

export async function getAdminDashboard() {
  const data = await request<AdminDashboard>('/api/admin/dashboard');
  return adminDashboardSchema.parse(data);
}

export async function getPendingRoomReviews() {
  const data = await request<AdminRoomReview[]>('/api/admin/rooms/pending');
  return adminRoomReviewSchema.array().parse(data);
}

export async function approveRoom(roomId: number) {
  const data = await request<AdminRoomReview>(`/api/admin/rooms/${roomId}/approve`, {
    method: 'POST',
  });
  return adminRoomReviewSchema.parse(data);
}

export async function rejectRoom(roomId: number) {
  const data = await request<AdminRoomReview>(`/api/admin/rooms/${roomId}/reject`, {
    method: 'POST',
  });
  return adminRoomReviewSchema.parse(data);
}

export async function getAdminUsers() {
  const data = await request<AdminUser[]>('/api/admin/users');
  return adminUserSchema.array().parse(data);
}

export async function getAdminReservations() {
  const data = await request<AdminReservation[]>('/api/admin/reservations');
  return adminReservationSchema.array().parse(data);
}

export async function getWaitlistSnapshot() {
  const data = await request<WaitlistSnapshot>('/api/admin/waitlist');
  return waitlistSnapshotSchema.parse(data);
}
