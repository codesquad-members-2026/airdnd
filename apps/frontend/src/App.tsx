import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
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
import { AppStateProvider, useAppState } from './shared/AppState';
import { ToastProvider, useToast } from './shared/Toast';
import { LoginModal } from './components/LoginModal';
import { SaveToWishlistModal } from './components/SaveToWishlistModal';
import { fetchListingWishlistId } from './shared/api/wishlist';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// 전역 로그인 모달: 401(세션 만료) 시 AppState가 열어 로그인을 유도한다.
// Header 없이 HostHeader 만 쓰는 페이지에서도 동작하도록 App 레벨에 단일 인스턴스로 둔다.
function GlobalLoginModal() {
  const { loginOpen, loginNotice, closeLogin } = useAppState();
  return <LoginModal open={loginOpen} notice={loginNotice} onClose={closeLogin} />;
}

// OAuth 복귀 후 하트 저장 의도를 "그 자리에서" 처리한다(상세로 이동하지 않음).
// 이미 담긴 숙소면 안내 토스트, 아니면 전역 저장 모달을 띄운다. App 레벨이라 어느 페이지에 있든 동작.
function GlobalSaveFlow() {
  const { pendingSaveHeart, clearPendingSaveHeart } = useAppState();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [saveFor, setSaveFor] = useState<number | null>(null);

  useEffect(() => {
    if (pendingSaveHeart == null) return;
    const listingId = pendingSaveHeart;
    clearPendingSaveHeart();
    fetchListingWishlistId(listingId)
      .then((wid) => {
        if (wid != null) toast.show('이미 위시리스트에 저장한 숙소예요');
        else setSaveFor(listingId);
      })
      .catch(() => setSaveFor(listingId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSaveHeart]);

  return (
    <SaveToWishlistModal
      open={saveFor != null}
      listingId={saveFor}
      onClose={() => setSaveFor(null)}
      onSaved={(name) => {
        setSaveFor(null);
        toast.show(`'${name}'에 저장했어요`);
        queryClient.invalidateQueries(); // 다른 페이지의 하트도 갱신되도록
      }}
    />
  );
}

// OAuth 복귀 시 백엔드가 붙인 ?auth=signup|login 을 읽어 성공 메시지를 띄우고 파라미터를 정리한다.
// (구글 로그인은 전체 리다이렉트라 LoginModal 의 토스트를 못 타므로 여기서 처리)
function OAuthResultToast() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const auth = params.get('auth');
    if (auth !== 'signup' && auth !== 'login') return;
    toast.success(auth === 'signup' ? '회원가입이 완료되었어요. 환영합니다!' : '로그인되었어요');
    const next = new URLSearchParams(params);
    next.delete('auth');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

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
        <GlobalLoginModal />
        <GlobalSaveFlow />
        <OAuthResultToast />
      </ToastProvider>
      </AppStateProvider>
    </BrowserRouter>
  );
}
