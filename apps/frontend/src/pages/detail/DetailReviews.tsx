import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../shared/Icon';
import { getReviewsOptions } from '../../shared/api/generated/@tanstack/react-query.gen';
import type { ReviewResponse } from '../../shared/api/generated/types.gen';
import { AllReviewsModal } from './AllReviewsModal';

interface DetailReviewsProps {
  reviews: number; // 총 후기 수(상세 summary 값)
  listingId: number; // 후기 조회 대상
}

const PREVIEW_SIZE = 6;

// 후기 섹션: 첫 페이지(최대 6개) 미리보기 + "모두 보기" 모달
export function DetailReviews({ reviews, listingId }: DetailReviewsProps) {
  const [allOpen, setAllOpen] = useState(false);

  const { data } = useQuery({
    ...getReviewsOptions({ path: { listingId }, query: { request: { size: PREVIEW_SIZE } } }),
    enabled: Number.isFinite(listingId),
  });
  const preview = data?.data?.content ?? [];

  return (
    <div style={{ padding: '40px 0', borderTop: '1px solid var(--line)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 64,
          rowGap: 36,
        }}
      >
        {preview.map((r) => (
          <ReviewCard key={r.reviewId} review={r} />
        ))}
      </div>

      <button
        onClick={() => setAllOpen(true)}
        style={{
          marginTop: 40,
          height: 48,
          padding: '0 24px',
          border: '1px solid var(--ink-1)',
          borderRadius: 10,
          background: '#fff',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink-1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
      >
        후기 {reviews}개 모두 보기
      </button>

      <AllReviewsModal
        open={allOpen}
        listingId={allOpen ? listingId : null}
        totalReviews={reviews}
        onClose={() => setAllOpen(false)}
      />
    </div>
  );
}

// 후기 0개: 평점 헤더 대신 빈 상태 하나로 표시
export function EmptyReviews({ hostName }: { hostName?: string }) {
  return (
    <div style={{ padding: '40px 0', borderTop: '1px solid var(--line)' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink-1)' }}>
        후기 (아직) 없음
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 28 }}>
        <Icon name="star" size={26} color="var(--ink-1)" fill="none" />
        <span style={{ fontSize: 15, color: 'var(--ink-1)', lineHeight: 1.5 }}>
          {hostName ? `${hostName}님의 다른 숙소도 둘러보세요.` : '이 호스트의 다른 숙소도 둘러보세요.'}
        </span>
      </div>
    </div>
  );
}

function formatDate(createdAt?: string): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function ReviewCard({ review }: { review: ReviewResponse }) {
  const stars = review.rating ?? 0;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--ink-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {review.author?.profileUrl ? (
            <img src={review.author.profileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Icon name="user" size={18} color="#fff" />
          )}
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{review.author?.nickname ?? '게스트'}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{formatDate(review.createdAt)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-2)', marginBottom: 6 }}>
        <span style={{ display: 'flex', gap: 1 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Icon key={i} name="star" size={10} color="var(--ink-1)" fill={i < stars ? 'var(--ink-1)' : 'none'} />
          ))}
        </span>
      </div>
      <div style={{ fontSize: 15, color: 'var(--ink-1)', lineHeight: 1.6 }}>{review.content}</div>
    </div>
  );
}
