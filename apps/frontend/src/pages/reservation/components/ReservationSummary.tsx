import { Icon } from '../../../shared/Icon';
import { won } from '../../../shared/utils';
import { listingImage } from '../utils';
import { TripInfoSection } from './TripInfoSection';
import type { Listing, SearchState } from '../../../types';

interface ReservationSummaryProps {
  listing: Listing;
  nights: number;
  roomTotal: number;
  total: number;
  search: SearchState;
  onChange: (v: SearchState) => void;
  /** 상세 API의 실제 이미지 URL. 없으면 데모 에셋으로 폴백. */
  imageUrl?: string;
}

export function ReservationSummary({
  listing,
  nights,
  roomTotal,
  total,
  search,
  onChange,
  imageUrl,
}: ReservationSummaryProps) {
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-lg)',
        padding: 24,
        background: '#fff',
      }}
    >
      {/* 숙소 헤더 */}
      <div style={{ display: 'flex', gap: 14, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 10,
            flexShrink: 0,
            background: `url(${imageUrl ?? listingImage(listing.img)}) center/cover`,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{listing.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 13 }}>
            <Icon name="star" size={13} color="var(--star)" fill="var(--star)" />
            <b>{listing.rating}</b>
            <span style={{ color: 'var(--ink-3)' }}>(후기 {listing.reviews}개)</span>
          </div>
        </div>
      </div>

      {/* 무료 취소 */}
      <div style={{ padding: '20px 0', borderBottom: '1px solid var(--line)', fontSize: 14, lineHeight: 1.6 }}>
        <b>무료 취소</b>
        <div style={{ color: 'var(--ink-3)' }}>
          체크인 48시간 전까지 취소하면 전액 환불됩니다. {' '}
          <span style={{ color: 'var(--ink-1)', textDecoration: 'underline', cursor: 'pointer' }}>
            전체 정책
          </span>
        </div>
      </div>

      {/* 여행 정보: 날짜 / 게스트 */}
      <div style={{ borderBottom: '1px solid var(--line)' }}>
        <TripInfoSection search={search} onChange={onChange} />
      </div>

      {/* 요금 세부정보 */}
      <div style={{ padding: '20px 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>요금 세부정보</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12 }}>
          <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--ink-4)' }}>
            {won(listing.price)} x {nights}박
          </span>
          <span>{won(roomTotal)}</span>
        </div>
      </div>

      {/* 총 합계 */}
      <div
        style={{
          borderTop: '1px solid var(--line)',
          paddingTop: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        <span>
          총 합계 <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>KRW</span>
        </span>
        <span>{won(total)}</span>
      </div>
      <div style={{ marginTop: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
          가격 세부정보
        </span>
      </div>
    </div>
  );
}
