import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../../components/Header';
import { Icon } from '../../../shared/Icon';
import { useAppState } from '../../../shared/AppState';
import { getReservationOptions } from '../../../shared/api/generated/@tanstack/react-query.gen';
import type { GuestCountsResponse } from '../../../shared/api/generated/types.gen';
import { StayMap } from './StayMap';
import { ReservationDetailsSection } from './ReservationDetailsSection';
import { GettingThereSection } from './GettingThereSection';
import { RulesSection } from './RulesSection';
import { HostSection } from './HostSection';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];


function fmtDate(dateStr: string | null | undefined): string {
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${WEEKDAYS[d.getDay()]}, ${d.getMonth() + 1}월 ${d.getDate()}일`;
    }
  }
  return '날짜 미정';
}

function guestSummary(g: GuestCountsResponse | undefined): string {
  const people = (g?.adultGuestNum ?? 0) + (g?.childGuestNum ?? 0);
  if (people <= 0) return '게스트 1명';
  const parts = [`게스트 ${people}명`];
  if (g?.petGuestNum) parts.push(`반려동물 ${g.petGuestNum}마리`);
  return parts.join(', ');
}

export function ReservationDetailPage() {
  const navigate = useNavigate();
  const { reservationId: idParam } = useParams();
  const reservationId = Number(idParam);
  const { search, selectedListing: listing, canceledIds } = useAppState();

  const detailQuery = useQuery({
    ...getReservationOptions({
      path: { reservationId },
    }),
    enabled: Number.isFinite(reservationId),
  });
  const detail = detailQuery.data?.data;

  // 서버 응답 우선, 없으면 AppState 목업으로 폴백
  const title = detail?.listingTitle ?? listing.title;
  const hostName = detail?.hostName ?? 'airdnd';
  const addressSummary = detail?.addressSummary ?? listing.loc;
  const addressDetail = detail?.addressDetail ?? `${listing.loc}, 인도네시아`;
  const checkIn = fmtDate(detail?.checkInDate ?? search.range?.a);
  const checkOut = fmtDate(detail?.checkOutDate ?? search.range?.b);
  const guests = guestSummary(detail?.guestCounts);
  const hostProfileUrl = detail?.hostProfileUrl;
  const isCanceled =
    detail?.state === 'GUEST_CANCELED' ||
    detail?.state === 'HOST_CANCELED' ||
    canceledIds.has(reservationId);
  const amountPaid =
    detail?.totalPrice != null
      ? `₩${Number(detail.totalPrice).toLocaleString('ko-KR')}`
      : '결제 정보 없음';
  const photos = detail?.images ?? [];

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header mode="minimal" />

      <div style={{ display: 'flex' }}>
        {/* 좌측 스크롤 컬럼 */}
        <div
          style={{
            width: 560,
            flexShrink: 0,
            padding: '24px 40px 80px',
            position: 'relative',
            zIndex: 1,
            boxShadow: '6px 0 16px rgba(0,0,0,0.06)',
          }}
        >
          <button
            onClick={() => navigate('/trips')}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 8,
              marginLeft: -8,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="뒤로"
          >
            <Icon name="arrow-left" size={22} />
          </button>

          <PhotoCarousel photos={photos} title={title} badge={isCanceled ? '취소됨' : '한 달 뒤'} />

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 30,
              marginTop: 28,
            }}
          >
            {title}
          </h1>
          <div style={{ fontSize: 16, color: 'var(--ink-3)', marginTop: 8 }}>
            호스트 {hostName}님
          </div>

          {/* 체크인 / 체크아웃 박스 (취소 시 숨김) */}
          {!isCanceled && (
            <div
              style={{
                display: 'flex',
                border: '1px solid var(--line)',
                borderRadius: 12,
                overflow: 'hidden',
                marginTop: 28,
              }}
            >
              <DateCell label="체크인" date={checkIn} time="오후 3:00" />
              <div style={{ width: 1, background: 'var(--line)' }} />
              <DateCell label="체크아웃" date={checkOut} time="오전 11:00" />
            </div>
          )}

          {/* 메뉴 링크 (취소 시 메시지만) */}
          <div style={{ marginTop: 32 }}>
            {!isCanceled && (
              <MenuRow
                icon="map-pin"
                title="찾아가는 길"
                sub={addressSummary}
                onClick={() =>
                  document.getElementById('getting-there')?.scrollIntoView({ behavior: 'smooth' })
                }
              />
            )}
            {!isCanceled && (
              <MenuRow icon="book-open" title="숙소 이용 안내" sub="이용 방법과 이용 수칙" />
            )}
            <MenuRow
              icon="message-circle"
              title="호스트에게 메시지"
              sub={`호스트 ${hostName}님`}
            />
            {!isCanceled && <MenuRow icon="building-2" title="내 숙소" sub={title} />}
          </div>

          <ReservationDetailsSection guestSummary={guests} reservationId={reservationId} canceled={isCanceled} />
          {!isCanceled && <GettingThereSection address={addressDetail} />}
          {!isCanceled && <RulesSection listingId={detail?.listingId ?? listing.id} />}
          <HostSection hostName={hostName} hostProfileUrl={hostProfileUrl} amountPaid={amountPaid} />
        </div>

        {/* 우측 고정 지도 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <StayMap
            label="머무는 곳"
            dateRange={search.dates || `${checkIn} – ${checkOut}`}
            lat={detail?.lat}
            lng={detail?.lng}
          />
        </div>
      </div>
    </div>
  );
}

function PhotoCarousel({ photos, title, badge }: { photos: string[]; title: string; badge: string }) {
  const [idx, setIdx] = useState(0);
  const go = (delta: number) =>
    setIdx((i) => Math.min(photos.length - 1, Math.max(0, i + delta)));

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        aspectRatio: '3 / 2',
        background: 'var(--surface-alt-2)',
      }}
    >
      {/* 슬라이드 트랙 */}
      <div
        style={{
          display: 'flex',
          height: '100%',
          transform: `translateX(-${idx * 100}%)`,
          transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={title}
            style={{ flex: '0 0 100%', width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ))}
      </div>
      <span
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 20,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-2)',
        }}
      >
        {badge}
      </span>
      {idx > 0 && <CarouselArrow side="left" onClick={() => go(-1)} />}
      {idx < photos.length - 1 && <CarouselArrow side="right" onClick={() => go(1)} />}

      {/* 점 인디케이터 */}
      {photos.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {photos.map((_, i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CarouselArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '50%',
        [side]: 14,
        transform: 'translateY(-50%)',
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,0.92)',
        boxShadow: 'var(--shadow-md)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={side === 'left' ? '이전 사진' : '다음 사진'}
    >
      <Icon name={side === 'left' ? 'chevron-left' : 'chevron-right'} size={20} />
    </button>
  );
}

function DateCell({ label, date, time }: { label: string; date: string; time: string }) {
  return (
    <div style={{ flex: 1, padding: '16px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 6 }}>{date}</div>
      <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 2 }}>{time}</div>
    </div>
  );
}

function MenuRow({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: string;
  title: string;
  sub: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        padding: '16px 0',
        borderTop: '1px solid var(--line)',
      }}
    >
      <Icon name={icon} size={24} color="var(--ink-2)" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}
