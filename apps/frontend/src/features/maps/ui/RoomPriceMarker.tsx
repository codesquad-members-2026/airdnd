import { Heart, Star } from 'lucide-react';
import { formatCurrency } from '../../../shared/lib/format';

interface RoomPriceMarkerProps {
  price: number;
  available: boolean;
  selected: boolean;
  hovered: boolean;
  viewed: boolean;
  wishlisted?: boolean;
  rating?: number | null;
}

// Anchored teardrop 가격 핀(Claude Design 핸드오프의 direction 3).
// 상태(hover/selected/viewed/sold-out) + 위시리스트 하트 + 평점 별을 모두 지원합니다.
export function RoomPriceMarker({
  price,
  available,
  selected,
  hovered,
  viewed,
  wishlisted = false,
  rating = null,
}: RoomPriceMarkerProps) {
  const className = [
    'am',
    'am--d3',
    selected ? 'is-selected' : '',
    !selected && hovered ? 'is-hover' : '',
    viewed && !selected ? 'is-viewed' : '',
    !available ? 'is-soldout' : '',
    wishlisted ? 'is-wishlisted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <Heart className="am__heart" size={13} fill="currentColor" aria-hidden="true" />
      {typeof rating === 'number' && available ? (
        <span className="am__rating">
          <Star className="am__star" size={12} fill="currentColor" aria-hidden="true" />
          {rating.toFixed(1)}
        </span>
      ) : null}
      <span className="am__price">{available ? formatCurrency(price) : '예약 마감'}</span>
    </div>
  );
}
