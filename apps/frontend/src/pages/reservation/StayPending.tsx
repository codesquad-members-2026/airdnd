import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PaymentStatusBadge } from './components/PaymentStatusBadge';
import { listingImage, nightsOf } from './utils';
import { won } from '../../shared/utils';
import { getHostListingDetailOptions } from '../../shared/api/generated/@tanstack/react-query.gen';
import { LISTINGS } from '../../shared/demoListings';
import { useAppState } from '../../shared/AppState';

export function StayPending() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { search, selectedListing } = useAppState();

  // 예약 완료 흐름(Checkout)에서만 진입 가능 — 직접 URL 접근/새로고침 차단
  if (!(location.state as { fromCheckout?: boolean } | null)?.fromCheckout) {
    return <Navigate to={`/listings/${id ?? ''}`} replace />;
  }

  const demoListing = LISTINGS.find((item) => String(item.id) === id) ?? selectedListing;

  // 예약 대상 숙소를 실제 상세 API로 가져온다(데모는 폴백). 제목/가격/이미지 표시에 사용.
  const listingId = id != null ? Number(id) : NaN;
  const detailQuery = useQuery({
    ...getHostListingDetailOptions({ path: { listingsId: listingId } }),
    enabled: Number.isFinite(listingId),
  });
  const d = detailQuery.data?.data;

  const listing = {
    ...demoListing,
    title: d?.name ?? demoListing.title,
    price: d?.pricePerNight ?? demoListing.price,
  };
  // 이미지는 listingImage가 데모 키만 매핑하므로 실 URL을 우선 사용, 없으면 데모 에셋 폴백.
  const heroImage = d?.images?.[0] ?? listingImage(demoListing.img);

  const onDone = () => navigate('/trips');
  const nights = nightsOf(search);
  const total = listing.price * nights;
  const dates = search.dates || '날짜 미정';
  const guestLabel = search.guestLabel || '게스트 1명';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 250,
        padding: 24,
      }}
    >
      {/* 결제 시작 로딩 모달과 동일한 오버레이 모달 카드 */}
      <div
        className="popover-enter"
        style={{
          background: '#fff',
          borderRadius: 20,
          width: 440,
          maxWidth: '100%',
          padding: '56px 40px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-pop)',
          fontFamily: 'var(--font-sans)',
        }}
      >
          <PaymentStatusBadge status="pending" />

          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
            예약이 대기 중이에요
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 12, lineHeight: 1.6 }}>
            본인 확인이 완료되면 호스트가 24시간 안에 예약을 확정합니다.<br />
            1시간 이내에 진행 상황을 이메일로 보내드릴게요.
          </p>

          {/* 예약 숙소 요약 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textAlign: 'left',
              background: 'var(--surface-alt)',
              borderRadius: 14,
              padding: 14,
              margin: '28px 0',
            }}
          >
            <img
              src={heroImage}
              alt={listing.title}
              style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {listing.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{dates}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
                {guestLabel} · 총 {won(total)}
              </div>
            </div>
          </div>

          <button
            onClick={onDone}
            style={{
              width: '100%',
              height: 48,
              border: 'none',
              borderRadius: 10,
              background: 'var(--cta-dark)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            확인
          </button>
      </div>
    </div>,
    document.body,
  );
}
