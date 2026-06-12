import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveRoom,
  getAdminDashboard,
  getAdminReservations,
  getAdminUsers,
  getPendingRoomReviews,
  getWaitlistSnapshot,
  rejectRoom,
} from './adminApi';

export const adminQueryKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  pendingRooms: ['admin', 'rooms', 'pending'] as const,
  users: ['admin', 'users'] as const,
  reservations: ['admin', 'reservations'] as const,
  waitlist: ['admin', 'waitlist'] as const,
};

export function useAdminDashboardQuery() {
  return useQuery({
    queryKey: adminQueryKeys.dashboard,
    queryFn: getAdminDashboard,
  });
}

export function usePendingRoomReviewsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.pendingRooms,
    queryFn: getPendingRoomReviews,
  });
}

export function useApproveRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.pendingRooms });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
    },
  });
}

export function useRejectRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.pendingRooms });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
    },
  });
}

export function useAdminUsersQuery() {
  return useQuery({
    queryKey: adminQueryKeys.users,
    queryFn: getAdminUsers,
  });
}

export function useAdminReservationsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.reservations,
    queryFn: getAdminReservations,
  });
}

export function useWaitlistSnapshotQuery() {
  return useQuery({
    queryKey: adminQueryKeys.waitlist,
    queryFn: getWaitlistSnapshot,
  });
}
