import { useState } from 'react';
import { Icon } from '../../shared/Icon';
import { won } from '../../shared/utils';
import type { ListingCardResponse } from '../../shared/api/generated/types.gen';

export function capacitySummary(c: ListingCardResponse): string {
  const cap = c.capacity;
  if (!cap) return '';
  const parts: string[] = [];
  if (cap.maxGuests) parts.push(`최대 ${cap.maxGuests}명`);
  if (cap.bedrooms != null) parts.push(`침실 ${cap.bedrooms}개`);
  if (cap.beds != null) parts.push(`침대 ${cap.beds}개`);
  return parts.join(' · ');
}

export function ResultCard({
  card,
  liked,
  onOpen,
  onHeart,
  onHover,
}: {
  card: ListingCardResponse;
  liked: boolean;
  onOpen: () => void;
  onHeart: () => void;
  onHover: (hovering: boolean) => void;
}) {
  const images = card.images ?? [];
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  // 실제로 넘겨서 도달한 최대 인덱스까지만 이미지 로드(첫 장만 즉시, 나머지는 넘길 때)
  const [maxLoaded, setMaxLoaded] = useState(0);
  const go = (delta: number) =>
    setIdx(i => {
      const next = Math.min(images.length - 1, Math.max(0, i + delta));
      setMaxLoaded(m => Math.max(m, next));
      return next;
    });

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => {
        onHover(true);
        setHovered(true);
      }}
      onMouseLeave={() => {
        onHover(false);
        setHovered(false);
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* 사진 캐러셀 */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '4 / 3',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'var(--surface-alt-2)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        {/* 슬라이드 트랙 */}
        {images.length > 0 && (
          <div
            style={{
              display: 'flex',
              height: '100%',
              transform: `translateX(-${idx * 100}%)`,
              transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {images.map((src, i) => (
              <div
                key={i}
                style={{
                  flex: '0 0 100%',
                  height: '100%',
                  background: 'var(--surface-alt-2)',
                }}
              >
                {/* 도달한 슬라이드만 실제 img 요청. 첫 장은 즉시·높은 우선순위 */}
                {i <= maxLoaded && (
                  <img
                    src={src}
                    alt=""
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    decoding="async"
                    draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <span
          onClick={e => {
            e.stopPropagation();
            onHeart();
          }}
          style={{ position: 'absolute', top: 10, right: 10, cursor: 'pointer', padding: 4, zIndex: 2 }}
        >
          <Icon
            name="heart"
            size={24}
            color="#fff"
            fill={liked ? 'var(--brand-coral)' : 'rgba(0,0,0,0.45)'}
            strokeWidth={2}
          />
        </span>

        {/* 좌우 화살표 (hover 시, 끝 도달 시 숨김) */}
        {hovered && images.length > 1 && idx > 0 && (
          <CarouselArrow side="left" onClick={e => { e.stopPropagation(); go(-1); }} />
        )}
        {hovered && images.length > 1 && idx < images.length - 1 && (
          <CarouselArrow side="right" onClick={e => { e.stopPropagation(); go(1); }} />
        )}

        {/* 점 인디케이터 */}
        {images.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              zIndex: 2,
            }}
          >
            {images.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: i === idx ? '#fff' : 'rgba(255,255,255,0.6)',
                  transition: 'background 120ms ease',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 정보 */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {card.name}
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 2 }}>{capacitySummary(card)}</div>
        <div style={{ fontSize: 14, marginTop: 6 }}>
          <b>{won(card.totalPrice ?? 0)}</b> <span style={{ color: 'var(--ink-3)' }}>총액</span>
        </div>
      </div>
    </div>
  );
}

function CarouselArrow({
  side,
  onClick,
}: {
  side: 'left' | 'right';
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? '이전 사진' : '다음 사진'}
      style={{
        position: 'absolute',
        top: '50%',
        [side]: 10,
        transform: 'translateY(-50%)',
        width: 30,
        height: 30,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}
    >
      <Icon name={side === 'left' ? 'chevron-left' : 'chevron-right'} size={18} />
    </button>
  );
}
