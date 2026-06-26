import { useState } from 'react';
import { Icon } from '../../shared/Icon';
import { isGuestFavorite } from '../../shared/guestFavorite';
// 라우렐 png — apps/frontend/src/assets/guest-favorite.png
import guestFavoriteIcon from '../../assets/guest-favorite.png';

interface DetailRatingsProps {
  rating: number; // 개요와 동일 값 사용(현재 목)
  reviews: number;
}

// 후기 섹션 헤더: 게스트 선호면 라우렐(별점 중복 표시 X), 아니면 "★ 평점 · 후기 N개"
export function DetailRatings({ rating, reviews }: DetailRatingsProps) {
  const favorite = isGuestFavorite(rating, reviews);
  const [open, setOpen] = useState(false);

  const modal = open && (
    <RatingsModal rating={rating} reviews={reviews} onClose={() => setOpen(false)} />
  );

  if (favorite) {
    return (
      <div style={{ padding: '40px 0 8px', borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <img src={guestFavoriteIcon} alt="" style={{ height: 120, width: 'auto', transform: 'rotate(10deg)' }} />
          <span style={{ fontSize: 84, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1, transform: 'translateY(-12px)' }}>
            {rating.toFixed(1)}
          </span>
          <img src={guestFavoriteIcon} alt="" style={{ height: 120, width: 'auto', transform: 'scaleX(-1) rotate(10deg)' }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>게스트 선호</div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.5 }}>
              게스트들의 좋은 평가를 받은 숙소입니다.
          </div>
          <ShowAllLink onClick={() => setOpen(true)} />
        </div>
        {modal}
      </div>
    );
  }

  // 일반 숙소: 별점 헤더
  return (
    <div style={{ padding: '40px 0 8px', borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="star" size={24} color="var(--ink-1)" fill="var(--ink-1)" />
        <span style={{ fontSize: 24, fontWeight: 700 }}>
          {rating.toFixed(2)} · 후기 {reviews}개
        </span>
      </div>
      <ShowAllLink onClick={() => setOpen(true)} />
      {modal}
    </div>
  );
}

function ShowAllLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        marginTop: 10,
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink-2)',
        textDecoration: 'underline',
      }}
    >
      전체 평점 보기
    </button>
  );
}

// 별점 분포(목): 대부분 5점
const STAR_DIST: Record<number, number> = { 5: 0.9, 4: 0.05, 3: 0.02, 2: 0.02, 1: 0.01 };

function RatingsModal({ rating, reviews, onClose }: { rating: number; reviews: number; onClose: () => void }) {
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 720,
          maxWidth: '92vw',
          maxHeight: '86vh',
          background: '#fff',
          borderRadius: 16,
          boxShadow: 'var(--shadow-pop)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', height: 64, display: 'flex', alignItems: 'center', paddingLeft: 24, borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{ position: 'absolute', left: 16, width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding: '28px 32px 36px', overflowY: 'auto' }}>
          {/* 큰 평점 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <Icon name="star" size={30} color="var(--ink-1)" fill="var(--ink-1)" />
            <span style={{ fontSize: 44, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {rating.toFixed(rating % 1 === 0 ? 0 : 2)}
            </span>
          </div>

          <div style={{ fontSize: 20, fontWeight: 700 }}>전체 평점</div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 2, marginBottom: 18 }}>
            후기 {reviews}건에 근거
          </div>

          {[5, 4, 3, 2, 1].map((n) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
              <span
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 6,
                  background: 'var(--surface-alt-2)',
                  border: '1px solid var(--line)',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${(STAR_DIST[n] ?? 0) * 100}%`,
                    background: 'linear-gradient(90deg, #8B2FB0 0%, #E0245E 60%, #F0533F 100%)',
                  }}
                />
              </span>
              <span style={{ width: 12, textAlign: 'right', fontSize: 15, color: 'var(--ink-2)' }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
