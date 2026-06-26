import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/Header';
import { Icon } from '../../shared/Icon';
import { useAppState } from '../../shared/AppState';
import { getMyReservationsOptions } from '../../shared/api/generated/@tanstack/react-query.gen';
import type { CurrentMemberInfo, ReservationSummary } from '../../shared/api/generated/types.gen';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// @CurrentMember는 서버 인증으로 처리되지만 OpenAPI엔 쿼리 파라미터로 노출됨 — 빈 스텁.
const MEMBER_STUB = {} as CurrentMemberInfo;

const STATE_LABEL: Record<NonNullable<ReservationSummary['state']>, string> = {
  PENDING: '대기 중',
  CONFIRMED: '예약 확정',
  GUEST_CANCELED: '취소됨',
  HOST_CANCELED: '취소됨',
  COMPLETED: '여행 완료',
};

function dayMark(dateStr: string | null | undefined): { wd: string; day: string } {
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return { wd: WEEKDAYS[d.getDay()], day: String(d.getDate()) };
    }
  }
  return { wd: '', day: '–' };
}

function rangeLabel(a?: string, b?: string): string {
  const fmt = (s?: string) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };
  const from = fmt(a);
  const to = fmt(b);
  if (from && to) return `${from} ~ ${to}`;
  return from || to || '날짜 미정';
}

export function TripsPage() {
  const query = useQuery(getMyReservationsOptions({ query: { memberInfo: MEMBER_STUB } }));
  const reservations = query.data?.data?.reservations ?? [];
  const region = reservations[0]?.region;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header mode="minimal" />

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '48px 48px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, marginBottom: 28 }}>
          여행
        </h1>

        {query.isLoading ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 16 }}>불러오는 중…</div>
        ) : query.isError ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 16 }}>예약 정보를 불러오지 못했어요.</div>
        ) : reservations.length === 0 ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 16 }}>아직 예약한 여행이 없어요.</div>
        ) : (
          <>
            {region && <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{region}</h2>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {reservations.map(r => (
                <TripCard key={r.reservationId} reservation={r} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TripCard({ reservation: r }: { reservation: ReservationSummary }) {
  const navigate = useNavigate();
  const { canceledIds } = useAppState();
  const [showTimeline, setShowTimeline] = useState(false);
  const dates = rangeLabel(r.checkInDate, r.checkOutDate);
  const checkIn = dayMark(r.checkInDate);
  const checkOut = dayMark(r.checkOutDate);
  const isCanceled =
    r.state === 'GUEST_CANCELED' ||
    r.state === 'HOST_CANCELED' ||
    (r.reservationId != null && canceledIds.has(r.reservationId));
  const stateLabel = isCanceled ? '취소됨' : r.state ? STATE_LABEL[r.state] : '';

  return (
    <div>
      <div
        onClick={() => navigate(`/trips/reservation/${r.reservationId}`)}
        style={{
          display: 'flex',
          gap: 32,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          padding: 20,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 420,
            flexShrink: 0,
            borderRadius: 12,
            overflow: 'hidden',
            aspectRatio: '3 / 2',
            background: 'var(--surface-alt-2)',
          }}
        >
          {r.coverImage && (
            <img
              src={r.coverImage}
              alt={r.listingTitle ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {stateLabel && (
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
              {stateLabel}
            </span>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26 }}>
            {r.listingTitle}
          </div>
          <div
            style={{
              fontSize: 16,
              color: 'var(--ink-3)',
              marginTop: 10,
              textDecoration: isCanceled ? 'line-through' : 'none',
            }}
          >
            {dates} · 호스트 airdnd님
          </div>

          <div
            style={{
              marginTop: 'auto',
              borderTop: '1px solid var(--line)',
              paddingTop: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 20,
            }}
          >
            <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5 }}>{r.region}</div>
            <button
              onClick={e => {
                e.stopPropagation();
                if (r.listingId != null) navigate(`/listings/${r.listingId}`);
              }}
              style={{
                flexShrink: 0,
                border: 'none',
                borderRadius: 10,
                background: 'var(--surface-alt-2)',
                padding: '12px 22px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--ink-1)',
              }}
            >
              찾아가는 길
            </button>
          </div>
        </div>
      </div>

      {/* 체크인 / 체크아웃 타임라인 (트리거 미연결, 추후) */}
      <AnimatePresence initial={false}>
        {showTimeline && (
          <motion.div
            key="timeline"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ position: 'relative', marginTop: 24 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 31,
                  top: 44,
                  bottom: 78,
                  width: 1,
                  background: 'linear-gradient(to bottom, var(--line-strong), transparent)',
                }}
              />
              <TimelineRow mark={checkIn} icon="🚪" text="오후 3:00 이후 체크인" />
              <TimelineRow mark={checkOut} icon="🏠" text="오전 11:00 이전 체크아웃" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* setShowTimeline 보존 (트리거 추가 시 사용) */}
      <span style={{ display: 'none' }} onClick={() => setShowTimeline(v => !v)} />
    </div>
  );
}

function TimelineRow({
  mark,
  icon,
  text,
}: {
  mark: { wd: string; day: string };
  icon: string;
  text: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16, position: 'relative' }}>
      <div style={{ width: 64, flexShrink: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 6 }}>{mark.wd}</div>
        <div
          style={{
            width: 44,
            height: 44,
            margin: '0 auto',
            borderRadius: '50%',
            background: 'var(--surface-alt-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {mark.day}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-md)',
          padding: '18px 22px',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: 10,
            background: 'var(--surface-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>{text}</div>
        <Icon name="chevron-right" size={20} color="var(--ink-3)" />
      </div>
    </div>
  );
}
