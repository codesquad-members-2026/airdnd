import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminPage } from '../../pages/admin/AdminPage';
import { AdminReservationsPage } from '../../pages/admin/AdminReservationsPage';
import { AdminRoomApprovalsPage } from '../../pages/admin/AdminRoomApprovalsPage';
import { AdminUsersPage } from '../../pages/admin/AdminUsersPage';
import { AdminWaitlistPage } from '../../pages/admin/AdminWaitlistPage';
import { AuthCallbackPage } from '../../pages/auth/AuthCallbackPage';
import { CheckoutPage } from '../../pages/checkout/CheckoutPage';
import { LoginPage } from '../../pages/auth/LoginPage';
import { ForbiddenPage } from '../../pages/ForbiddenPage';
import { HostRoomFormPage } from '../../pages/host/HostRoomFormPage';
import { HostRoomReservationsPage } from '../../pages/host/HostRoomReservationsPage';
import { HostRoomsPage } from '../../pages/host/HostRoomsPage';
import { MyPage } from '../../pages/my/MyPage';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { MapSearchPage } from '../../pages/map/MapSearchPage';
import { NotificationsPage } from '../../pages/notifications/NotificationsPage';
import { ReservationDetailPage } from '../../pages/reservations/ReservationDetailPage';
import { ReservationsPage } from '../../pages/reservations/ReservationsPage';
import { HomePage } from '../../pages/rooms/HomePage';
import { RoomDetailPage } from '../../pages/rooms/RoomDetailPage';
import { WishlistsPage } from '../../pages/wishlist/WishlistsPage';
import { WishlistDetailPage } from '../../pages/wishlist/WishlistDetailPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/rooms/map', element: <MapSearchPage /> },
      { path: '/rooms/:roomId', element: <RoomDetailPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/forbidden', element: <ForbiddenPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/checkout/:reservationId', element: <CheckoutPage /> },
          { path: '/reservations', element: <ReservationsPage /> },
          { path: '/reservations/:reservationId', element: <ReservationDetailPage /> },
          { path: '/wishlists', element: <WishlistsPage /> },
          { path: '/wishlists/:wishlistId', element: <WishlistDetailPage /> },
          { path: '/my', element: <MyPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['HOST', 'ADMIN']} />,
        children: [
          { path: '/host/rooms', element: <HostRoomsPage /> },
          { path: '/host/rooms/new', element: <HostRoomFormPage /> },
          { path: '/host/rooms/:roomId/edit', element: <HostRoomFormPage /> },
          { path: '/host/rooms/:roomId/reservations', element: <HostRoomReservationsPage /> },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['ADMIN']} />,
        children: [
          { path: '/admin', element: <AdminPage /> },
          { path: '/admin/rooms/pending', element: <AdminRoomApprovalsPage /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/reservations', element: <AdminReservationsPage /> },
          { path: '/admin/waitlist', element: <AdminWaitlistPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
