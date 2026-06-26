import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '../../shared/Icon';
import { getReviews } from '../../shared/api/generated/sdk.gen';
import type { ReviewResponse } from '../../shared/api/generated/types.gen';

interface AllReviewsModalProps {
  open: boolean;
  /** 조회 대상 리스팅 id (열려 있을 땐 non-null) */
  listingId: number | null;
  /** 총 후기 수 (헤더 표시용) */
  totalReviews: number;
  onClose: () => void;
}

const PAGE_SIZE = 20;

/**
 * "후기 모두 보기" 모달. GET /api/listings/{listingId}/reviews 커서 페이징.
 * 열릴 때 첫 페이지를 불러오고, 하단 sentinel이 보이면 무한 스크롤로 다음 페이지를 이어 받는다.
 */
export function AllReviewsModal({ open, listingId, totalReviews, onClose }: AllReviewsModalProps) {
  const [items, setItems] = useState<ReviewResponse[]>([]);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (nextCursor: number | undefined) => {
      if (listingId == null) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getReviews({
          path: { listingId },
          query: { request: { size: PAGE_SIZE, cursor: nextCursor } },
        });
        const page = res.data?.data;
        setItems((prev) => (nextCursor == null ? page?.content ?? [] : [...prev, ...(page?.content ?? [])]));
        setCursor(page?.nextCursor);
        setHasNext(page?.hasNext ?? false);
      } catch {
        setError('후기를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [listingId],
  );

  // 열릴 때마다 처음부터 다시 로드 (loadPage가 첫 페이지에서 목록을 교체한다)
  useEffect(() => {
    if (!open) return;
    // 모달 오픈 시 1회 외부(API) 동기화 목적의 의도된 패칭이다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage(undefined);
  }, [open, loadPage]);

  // 무한 스크롤: 하단 sentinel이 스크롤 영역에 들어오면 다음 페이지 로드
  useEffect(() => {
    if (!open || !hasNext || loading) return;
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadPage(cursor);
      },
      { root, rootMargin: '160px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, hasNext, loading, cursor, loadPage]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        ref={scrollRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(720px, 92vw)',
          maxHeight: '86vh',
          background: '#fff',
          borderRadius: 16,
          padding: '24px 32px 32px',
          overflowY: 'auto',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-1)' }}>후기 {totalReviews}개</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
          >
            <Icon name="x" size={20} color="var(--ink-1)" />
          </button>
        </div>

        {error && <div style={{ color: 'var(--danger, #c00)', fontSize: 14, marginBottom: 16 }}>{error}</div>}

        {items.length === 0 && !loading && !error && (
          <div style={{ fontSize: 15, color: 'var(--ink-3)', padding: '24px 0' }}>아직 작성된 후기가 없습니다.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {items.map((r) => (
            <ReviewRow key={r.reviewId} review={r} />
          ))}
        </div>

        {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}

        {loading && items.length > 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 14, color: 'var(--ink-3)' }}>
            불러오는 중…
          </div>
        )}
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

function ReviewRow({ review }: { review: ReviewResponse }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Icon key={i} name="star" size={10} color="var(--ink-1)" fill={i < stars ? 'var(--ink-1)' : 'none'} />
        ))}
      </div>
      <div style={{ fontSize: 15, color: 'var(--ink-1)', lineHeight: 1.6 }}>{review.content}</div>
    </div>
  );
}
