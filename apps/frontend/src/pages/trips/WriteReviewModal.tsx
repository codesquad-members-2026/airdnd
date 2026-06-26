import { useState } from 'react';
import { Icon } from '../../shared/Icon';
import { createReview } from '../../shared/api/generated/sdk.gen';

interface WriteReviewModalProps {
  open: boolean;
  /** 후기를 작성할 예약 id (열려 있을 땐 non-null) */
  reservationId: number | null;
  /** 헤더에 보여줄 숙소명 */
  listingTitle?: string;
  onClose: () => void;
  /** 작성 성공 시: 부모가 버튼을 "작성 완료"로 전환 */
  onSubmitted: () => void;
}

const MAX_CONTENT = 1000;

/**
 * 여행 완료 후 후기 작성 모달. POST /api/reservations/{reservationId}/reviews.
 * 별점(필수 1~5) + 내용(선택)을 받아 createReview 호출.
 */
export function WriteReviewModal({ open, reservationId, listingTitle, onClose, onSubmitted }: WriteReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 부모가 open일 때만 마운트하므로 매번 새 상태로 시작한다(별도 초기화 불필요).
  if (!open) return null;

  const submit = async () => {
    if (reservationId == null) return;
    if (rating < 1) {
      setError('별점을 선택해주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await createReview({
        path: { reservationId },
        body: { rating, content: content.trim() || undefined },
      });
      if (res.error) {
        setError('후기 작성에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      onSubmitted();
    } catch {
      setError('후기 작성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const shown = hover || rating;

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
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 92vw)',
          background: '#fff',
          borderRadius: 16,
          padding: '24px 28px 28px',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-1)' }}>후기 작성</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
          >
            <Icon name="x" size={20} color="var(--ink-1)" />
          </button>
        </div>
        {listingTitle && <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 20 }}>{listingTitle}</div>}

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n}점`}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }}
            >
              <Icon name="star" size={32} color="var(--ink-1)" fill={n <= shown ? 'var(--ink-1)' : 'none'} />
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
          placeholder="숙소는 어떠셨나요? (선택)"
          rows={5}
          style={{
            width: '100%',
            resize: 'vertical',
            border: '1px solid var(--line-strong)',
            borderRadius: 10,
            padding: 12,
            fontSize: 15,
            fontFamily: 'var(--font-sans)',
            color: 'var(--ink-1)',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
          {content.length} / {MAX_CONTENT}
        </div>

        {error && <div style={{ color: 'var(--danger, #c00)', fontSize: 14, marginTop: 8 }}>{error}</div>}

        <button
          onClick={submit}
          disabled={submitting}
          style={{
            marginTop: 20,
            width: '100%',
            height: 50,
            border: 'none',
            borderRadius: 10,
            background: 'var(--cta-dark, var(--ink-1))',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '등록 중…' : '후기 등록'}
        </button>
      </div>
    </div>
  );
}
