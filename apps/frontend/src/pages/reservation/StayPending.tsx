import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { SlimHeader } from './components/SlimHeader';
import { listingImage, nightsOf } from './utils';
import { won } from '../../shared/utils';
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

  const listing = LISTINGS.find((item) => String(item.id) === id) ?? selectedListing;
  const onDone = () => navigate('/trips');
  const nights = nightsOf(search);
  const total = listing.price * nights;
  const dates = search.dates || '날짜 미정';
  const guestLabel = search.guestLabel || '게스트 1명';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-alt)' }}>
      <SlimHeader />

      <div
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          padding: '64px 48px',
          display: 'flex',
          gap: 80,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        {/* 예약 카드 (애니메이션) */}
        <motion.div
          initial={{ rotateY: 46, opacity: 0.85 }}
          animate={{ rotateY: [46, -7, 0], opacity: 1 }}
          transition={{
            duration: 1.8,
            opacity: { duration: 0.6 },
            rotateY: { duration: 1.8, times: [0, 0.78, 1], ease: [0.22, 0.7, 0.3, 1] },
          }}
          style={{
            width: 380,
            flexShrink: 0,
            background: '#fff',
            borderRadius: 20,
            boxShadow: 'var(--shadow-lg)',
            padding: 20,
            transformPerspective: 1200,
            transformOrigin: 'right center',
          }}
        >
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '1 / 1' }}>
            <motion.img
              src={listingImage(listing.img)}
              alt={listing.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <span
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                background: '#fff',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 700,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              대기 중
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.85, ease: 'easeOut' }}
            style={{ padding: '20px 8px 8px' }}
          >
            <div style={{ fontSize: 19, fontWeight: 700 }}>{listing.title}</div>
            <div style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 4 }}>{dates}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0, ease: 'easeOut' }}
            style={{ padding: '40px 8px 8px', fontSize: 15, color: 'var(--ink-3)' }}
          >
            <div>{guestLabel}</div>
            <div style={{ marginTop: 4 }}>총 {won(total)}</div>
          </motion.div>
        </motion.div>

        {/* 안내 */}
        <div style={{ flex: 1, maxWidth: 460 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 48,
              lineHeight: 1.15,
              marginBottom: 24,
            }}
          >
            예약이<br />대기 중이에요
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 36 }}>
            본인 확인이 완료되면 호스트가 24시간 안에 예약을 확정합니다.<br />
            1시간 이내에 진행 상황을 이메일로 보내드릴게요.
          </p>
          <button
            onClick={onDone}
            style={{
              height: 52,
              padding: '0 32px',
              border: 'none',
              borderRadius: 12,
              background: 'var(--cta-dark)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
