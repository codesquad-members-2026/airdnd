import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Results } from './pages/listing/ListingSearchPage';
import { Detail } from './pages/Detail';
import { Checkout } from './pages/reservation/Checkout';
import { StayPending } from './pages/reservation/StayPending';
import { TripsPage } from './pages/trips/TripsPage';
import { ReservationDetailPage } from './pages/trips/reservation-detail/ReservationDetailPage';
import { CancelReservationPage } from './pages/trips/cancel/CancelReservationPage';
import { HostDashboard } from './pages/host/HostDashboard';
import { HostListingForm } from './pages/host/HostListingForm';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MyPage } from './pages/mypage/MyPage';
import { WishlistPage } from './pages/wishlist/WishlistPage';
import { WishlistDetailPage } from './pages/wishlist/WishlistDetailPage';
import { SignupPage } from './pages/auth/SignupPage';
import { PaymentSuccess } from './pages/payment/PaymentSuccess';
import { PaymentFail } from './pages/payment/PaymentFail';
import { AppStateProvider } from './shared/AppState';
import { ToastProvider } from './shared/Toast';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <ToastProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/listings/:id" element={<Detail />} />
          <Route path="/listings/:id/checkout" element={<Checkout />} />
          <Route path="/listings/:id/pending" element={<StayPending />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/reservation/:reservationId" element={<ReservationDetailPage />} />
          <Route path="/trips/reservation/:reservationId/cancel" element={<CancelReservationPage />} />
          <Route path="/host" element={<HostDashboard />} />
          <Route path="/host/new" element={<HostListingForm />} />
          <Route path="/host/listings/:id/edit" element={<HostListingForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/wishlists" element={<WishlistPage />} />
          <Route path="/wishlists/:id" element={<WishlistDetailPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* 토스 결제창 Redirect 도착지 (백엔드 toss.success-url / fail-url 과 일치) */}
          <Route path="/payments/success" element={<PaymentSuccess />} />
          <Route path="/payments/fail" element={<PaymentFail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
      </AppStateProvider>
    </BrowserRouter>
  );
}
