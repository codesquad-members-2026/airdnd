import { Icon } from '../../shared/Icon';
import { isGuestFavorite } from '../../shared/guestFavorite';

interface DetailOverviewProps {
  roomTypeLabel: string; // "집 전체"
  location: string;
  capacityLine: string; // "게스트 2명 · 침실 1개 · 침대 1개 · 욕실 1.5개"
  rating: number;
  reviews: number;
  hostName: string;
  profileUrl?: string | null;
  onHostClick?: () => void;
}

// 레퍼런스 개요: 유형/수용 + 게스트 favorite 배지 + 호스트 줄
export function DetailOverview({
  roomTypeLabel,
  location,
  capacityLine,
  rating,
  reviews,
  hostName,
  profileUrl,
  onHostClick,
}: DetailOverviewProps) {
  return (
    <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--line)' }}>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
        {roomTypeLabel} · {location}
      </div>
      <div style={{ fontSize: 15, color: 'var(--ink-2)', marginBottom: 22 }}>{capacityLine}</div>

      {/* 게스트 favorite 배지 — 평점 4.5 이상 & 후기 10개 이상일 때만 노출 */}
      {isGuestFavorite(rating, reviews) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '18px 22px',
            border: '1px solid var(--line)',
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>게스트 선호</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.4 }}>
              평점, 후기, 신뢰도를 기반으로 가장 사랑받는 숙소예요
            </div>
          </div>
          <Stat value={rating.toFixed(2)} sub={<Stars />} />
          <div style={{ width: 1, height: 36, background: 'var(--line)' }} />
          <Stat value={String(reviews)} sub={<span style={{ fontSize: 12, textDecoration: 'underline' }}>후기</span>} />
        </div>
      )}

      {/* 호스트 — 클릭 시 호스트 소개 섹션으로 스크롤 */}
      <div
        onClick={onHostClick}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 24, cursor: onHostClick ? 'pointer' : 'default' }}
      >
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
          {profileUrl ? (
            <img src={profileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Icon name="user" size={18} color="#fff" />
          )}
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>호스트: {hostName}님</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>슈퍼호스트 · 5년 호스팅</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, sub }: { value: string; sub: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</div>
      <div style={{ marginTop: 2, display: 'flex', justifyContent: 'center' }}>{sub}</div>
    </div>
  );
}

function Stars() {
  return (
    <span style={{ display: 'flex', gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} name="star" size={9} color="var(--ink-1)" fill="var(--ink-1)" />
      ))}
    </span>
  );
}
