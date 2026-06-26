import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { HostHeader } from '../../components/HostHeader';
import { Icon } from '../../shared/Icon';
import { won } from '../../shared/utils';
import { useHostListings } from '../../shared/useHostListings';
import {
  activateListingMutation,
  deactivateListingMutation,
} from '../../shared/api/generated/@tanstack/react-query.gen';
import type { HostListing, ListingState } from '../../types';

const STATE_BADGE: Record<ListingState, { text: string; bg: string }> = {
  APPROVED: { text: '활성',    bg: 'rgba(17,137,23,0.9)' },
  INACTIVE: { text: '비활성',  bg: 'rgba(0,0,0,0.5)' },
  PENDING:  { text: '검토 중', bg: 'rgba(180,120,0,0.9)' },
  REJECTED: { text: '반려됨',  bg: 'rgba(180,0,0,0.9)' },
};

export function HostDashboard() {
  const navigate = useNavigate();
  const { listings, isLoading, refetch } = useHostListings();
  const activate = useMutation(activateListingMutation());
  const deactivate = useMutation(deactivateListingMutation());

  const onLogo = () => navigate('/');
  const onNew = () => navigate('/host/new');
  const onEdit = (l: HostListing) => navigate(`/host/listings/${l.id}/edit`);

  function onToggleActive(id: string) {
    const target = listings.find((l) => l.id === id);
    if (!target) return;
    const listingsId = Number(id);
    if (target.active) {
      deactivate.mutate(
        { path: { listingsId } },
        { onSuccess: () => refetch() },
      );
    } else {
      activate.mutate(
        { path: { listingsId } },
        {
          onSuccess: () => refetch(),
          onError: () => alert('활성화에 실패했습니다. 관리자 승인이 필요한 숙소입니다.'),
        },
      );
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-alt)' }}>
      <HostHeader
        title="내 숙소 관리"
        onLogo={onLogo}
        action={
          <button
            onClick={onNew}
            style={{
              height: 44,
              padding: '0 24px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--brand-coral)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 120ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-coral-press)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand-coral)')}
          >
            <Icon name="plus" size={18} color="#fff" />
            새 숙소 등록
          </button>
        }
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 48px 80px' }}>
        {isLoading ? (
          <LoadingState />
        ) : listings.length === 0 ? (
          <EmptyState onNew={onNew} />
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 28,
                color: 'var(--ink-1)',
                marginBottom: 6,
              }}>
                내 숙소
              </h1>
              <p style={{ fontSize: 15, color: 'var(--ink-3)' }}>
                총 {listings.length}개의 숙소를 운영 중입니다.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
            }}>
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onEdit={() => onEdit(l)}
                  onToggleActive={() => onToggleActive(l.id)}
                  onOpen={() => navigate(`/listings/${l.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ListingCard({
  listing: l,
  onEdit,
  onToggleActive,
  onOpen,
}: {
  listing: HostListing;
  onEdit: () => void;
  onToggleActive: () => void;
  onOpen: () => void;
}) {
  const imgSrc = l.imageUrls[0];
  const badge = STATE_BADGE[l.state ?? (l.active ? 'APPROVED' : 'INACTIVE')];
  const canToggle = l.state === 'APPROVED' || l.state === 'INACTIVE' || l.state == null;
  // 검토 중(PENDING)·거절(REJECTED)은 상세 진입 불가
  const canOpen = l.state !== 'PENDING' && l.state !== 'REJECTED';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 160ms ease',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
    >
      {/* Image — 클릭 시 상세 이동(검토 중 제외) */}
      <div
        onClick={canOpen ? onOpen : undefined}
        style={{ position: 'relative', height: 200, cursor: canOpen ? 'pointer' : 'default', background: 'var(--surface-alt-2)' }}
      >
        {imgSrc && (
          <img
            src={imgSrc}
            alt={l.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {/* State badge */}
        <span style={{
          position: 'absolute',
          top: 14,
          left: 14,
          padding: '4px 12px',
          borderRadius: 30,
          fontSize: 12,
          fontWeight: 700,
          background: badge.bg,
          color: '#fff',
          backdropFilter: 'blur(4px)',
        }}>
          {badge.text}
        </span>
        {/* Room type badge */}
        <span style={{
          position: 'absolute',
          top: 14,
          right: 14,
          padding: '4px 12px',
          borderRadius: 30,
          fontSize: 12,
          fontWeight: 500,
          background: 'rgba(255,255,255,0.88)',
          color: 'var(--ink-1)',
          backdropFilter: 'blur(4px)',
        }}>
          {l.roomType}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>{l.loc}</div>
        <div style={{
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--ink-1)',
          marginBottom: 10,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {l.title}
        </div>

        {/* Specs */}
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 'auto' }}>
          최대 {l.maxGuests}명 · 침실 {l.bedrooms}개 · 침대 {l.beds}개 · 욕실 {l.bathrooms}개
        </div>

        <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>
            {won(l.price)}
            <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--ink-3)' }}> / 박</span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onEdit}
              style={{
                flex: 1,
                height: 38,
                border: '1px solid var(--line-strong)',
                borderRadius: 8,
                background: '#fff',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--ink-1)',
                cursor: 'pointer',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              수정하기
            </button>
            {canToggle && (
              <button
                onClick={onToggleActive}
                style={{
                  flex: 1,
                  height: 38,
                  border: 'none',
                  borderRadius: 8,
                  background: l.active ? 'var(--surface-alt-2)' : 'var(--cta-dark)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: l.active ? 'var(--ink-2)' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
              >
                {l.active ? '비활성화' : '활성화'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--ink-3)', fontSize: 16 }}>
      숙소 목록을 불러오는 중...
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '100px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'var(--brand-coral-tint)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
      }}>
        <Icon name="map-pin" size={32} color="var(--brand-coral)" />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
        아직 등록된 숙소가 없어요
      </div>
      <div style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6 }}>
        첫 번째 숙소를 등록하고 게스트를 맞이해보세요.
      </div>
      <button
        onClick={onNew}
        style={{
          marginTop: 8,
          height: 48,
          padding: '0 32px',
          borderRadius: 10,
          border: 'none',
          background: 'var(--brand-coral)',
          color: '#fff',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        숙소 등록하기
      </button>
    </div>
  );
}
