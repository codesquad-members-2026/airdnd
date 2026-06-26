import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../shared/Icon';
import { getListingsOptions } from '../../shared/api/generated/@tanstack/react-query.gen';
import type { ListingCardResponse } from '../../shared/api/generated/types.gen';
import type { RegionOption } from '../../shared/regions';
import { ResultCard } from '../listing/ResultCard';

const GAP = 20;
// 한 줄에 6개 보이도록 카드 폭 고정. 10개 조회 → 나머지는 가로 스크롤
const CARD_BASIS = `calc((100% - ${GAP * 5}px) / 6)`;

export function RegionRow({
  region,
  onOpenListing,
  onSeeAll,
  isLiked,
  onHeart,
}: {
  region: RegionOption;
  onOpenListing: (id: number) => void;
  onSeeAll: (region: RegionOption) => void;
  isLiked: (c: ListingCardResponse) => boolean;
  onHeart: (c: ListingCardResponse) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const query = useQuery(
    getListingsOptions({
      query: {
        condition: {
          region: {
            sidoCode: region.sidoCode,
            sigunguCode: region.sigunguCode ?? undefined,
          },
        },
        pageRequest: { page: 0, size: 10 },
      },
    }),
  );
  const cards = query.data?.data?.content ?? [];

  // 스크롤 위치로 좌우 버튼 활성/비활성 갱신
  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  // 카드 렌더 후 초기 상태 반영
  useEffect(updateArrows, [cards.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  // 조회 결과 없으면 행 자체를 숨김
  if (!query.isLoading && cards.length === 0) return null;

  return (
    <section style={{ padding: '40px 80px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button
          onClick={() => onSeeAll(region)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 22,
            color: 'var(--black)',
            letterSpacing: '-0.01em',
          }}
        >
          {region.label}의 인기 숙소
          <Icon name="chevron-right" size={18} />
        </button>

        {/* 좌우 스크롤 화살표 — 항상 노출, 끝 도달 시 비활성화 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <RowArrow dir="left" disabled={!canLeft} onClick={() => scrollBy(-1)} />
          <RowArrow dir="right" disabled={!canRight} onClick={() => scrollBy(1)} />
        </div>
      </div>

      {query.isLoading ? (
        <div style={{ color: 'var(--ink-3)' }}>불러오는 중…</div>
      ) : (
        <div
          ref={scrollRef}
          className="region-scroll"
          onScroll={updateArrows}
          style={{
            display: 'flex',
            gap: GAP,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            scrollSnapType: 'x mandatory',
          }}
        >
          {cards.map((c, i) => (
            <div key={c.id ?? i} style={{ flex: `0 0 ${CARD_BASIS}`, scrollSnapAlign: 'start' }}>
              <ResultCard
                card={c}
                liked={isLiked(c)}
                onOpen={() => c.id != null && onOpenListing(c.id)}
                onHeart={() => onHeart(c)}
                onHover={() => {}}
              />
            </div>
          ))}

          {/* 행 끝 전체보기 카드 */}
          <SeeAllCard
            cards={cards}
            onClick={() => onSeeAll(region)}
            style={{ flex: `0 0 ${CARD_BASIS}`, scrollSnapAlign: 'start' }}
          />
        </div>
      )}
    </section>
  );
}

function SeeAllCard({
  cards,
  onClick,
  style,
}: {
  cards: ListingCardResponse[];
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  // 미리보기용 썸네일 3장
  const thumbs = cards
    .map((c) => c.images?.[0])
    .filter((src): src is string => !!src)
    .slice(0, 3);

  return (
    <div style={style}>
      <div
        onClick={onClick}
        style={{
          cursor: 'pointer',
          aspectRatio: '4 / 3',
          borderRadius: 14,
          background: 'var(--surface-alt-2)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        {/* 비스듬히 겹친 썸네일 콜라주 */}
        <div style={{ position: 'relative', width: 96, height: 72 }}>
          {thumbs.map((src, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: i * 16,
                top: i * 6,
                width: 64,
                height: 56,
                borderRadius: 10,
                background: `url(${src}) center/cover`,
                border: '2px solid #fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transform: `rotate(${(i - 1) * 6}deg)`,
              }}
            />
          ))}
        </div>
        <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink-1)' }}>전체 보기</div>
      </div>
    </div>
  );
}

function RowArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'left' ? '이전' : '다음'}
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '1px solid var(--line)',
        background: '#fff',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      <Icon name={dir === 'left' ? 'chevron-left' : 'chevron-right'} size={16} />
    </button>
  );
}
