import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '../../components/Header';
import { Icon } from '../../shared/Icon';
import { useAppState } from '../../shared/AppState';
import { getMyReservationsOptions, getMyPastReservationsOptions } from '../../shared/api/generated/@tanstack/react-query.gen';
import type { ReservationSummary } from '../../shared/api/generated/types.gen';
import { preparePayment, ApiError, UNUSABLE_RESERVATION_CODES } from '../../shared/api/payment';
import { startCardPayment } from '../../shared/payment/toss';
import { WriteReviewModal } from './WriteReviewModal';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];


const STATE_LABEL: Record<NonNullable<ReservationSummary['state']>, string> = {
  PENDING: '대기 중',
  CONFIRMED: '예약 확정',
  GUEST_CANCELED: '취소됨',
  HOST_CANCELED: '취소됨',
  COMPLETED: '여행 완료',
  EXPIRED: '만료됨',
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

// 리뷰 작성 마감(체크아웃 + 7일)까지 남은 일수. 지났으면 음수, 날짜 불명이면 null
function reviewDaysLeft(checkOutDate?: string | null): number | null {
  if (!checkOutDate) return null;
  const co = new Date(checkOutDate);
  if (isNaN(co.getTime())) return null;
  const deadline = new Date(co);
  deadline.setDate(deadline.getDate() + 7);
  deadline.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((deadline.getTime() - today.getTime()) / 86400000);
}

export function TripsPage() {
  const query = useQuery(getMyReservationsOptions());
  const queryClient = useQueryClient();
  const reservations = query.data?.data?.reservations ?? [];

  const [resumingId, setResumingId] = useState<number | null>(null);
  const [resumeError, setResumeError] = useState('');
  // 탭: 예정된 여행 / 지난 여행
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  // 지난 여행은 별도 엔드포인트(체크아웃 지난 예약). 탭 진입 시 조회
  const pastQuery = useQuery({
    ...getMyPastReservationsOptions(),
    enabled: tab === 'past',
  });
  const past = pastQuery.data?.data?.reservations ?? [];

  // PENDING 카드 클릭 → 기존 예약으로 결제 이어하기 (상세 안 거치고 prepare → 토스 결제창).
  async function handleResume(reservationId: number) {
    setResumeError('');
    setResumingId(reservationId);
    try {
      const prepare = await preparePayment(reservationId);
      await startCardPayment(prepare); // 성공 시 토스로 리다이렉트(여기로 돌아오지 않음)
    } catch (e) {
      setResumingId(null);
      if (e instanceof ApiError && e.code && UNUSABLE_RESERVATION_CODES.has(e.code)) {
        // 결제 가능 시간(TTL)이 지나 예약이 만료/소멸됨 → 목록 새로고침으로 항목 정리.
        setResumeError('결제 가능 시간이 지났어요. 숙소에서 다시 예약해 주세요.');
        queryClient.invalidateQueries();
      } else {
        setResumeError(e instanceof Error ? e.message : '결제를 시작하지 못했어요.');
      }
    }
  }

  // 상태별 그룹핑(예정된 여행 탭). EXPIRED 등 그 외 상태는 숨긴다(버려진 예약).
  const pending: ReservationSummary[] = [];
  const upcoming: ReservationSummary[] = [];
  for (const r of reservations) {
    if (r.state === 'PENDING') pending.push(r);
    else if (r.state === 'CONFIRMED') upcoming.push(r);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header mode="minimal" />

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '48px 48px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, marginBottom: 20 }}>
          여행
        </h1>

        {/* 탭: 예정된 여행 / 지난 여행 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          <TabButton active={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
            예정된 여행
          </TabButton>
          <TabButton active={tab === 'past'} onClick={() => setTab('past')}>
            지난 여행
          </TabButton>
        </div>

        {tab === 'upcoming' ? (
          query.isLoading ? (
            <div style={{ color: 'var(--ink-3)', fontSize: 16 }}>불러오는 중…</div>
          ) : query.isError ? (
            <div style={{ color: 'var(--ink-3)', fontSize: 16 }}>예약 정보를 불러오지 못했어요.</div>
          ) : pending.length + upcoming.length === 0 ? (
            <div style={{ color: 'var(--ink-3)', fontSize: 16 }}>예정된 여행이 없어요.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {resumeError && (
                <div
                  style={{
                    background: 'var(--surface-alt-2)',
                    borderRadius: 12,
                    padding: '14px 18px',
                    fontSize: 15,
                    color: 'var(--brand-coral)',
                  }}
                >
                  {resumeError}
                </div>
              )}

              <Section title="결제 대기" count={pending.length}>
                {pending.map((r) => (
                  <TripCard
                    key={r.reservationId}
                    reservation={r}
                    cta="결제 이어하기"
                    busy={resumingId === r.reservationId}
                    onCardClick={() => r.reservationId != null && handleResume(r.reservationId)}
                  />
                ))}
              </Section>

              <Section title="예정된 여행" count={upcoming.length}>
                {upcoming.map((r) => (
                  <TripCard key={r.reservationId} reservation={r} />
                ))}
              </Section>
            </div>
          )
        ) : pastQuery.isLoading ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 16 }}>불러오는 중…</div>
        ) : pastQuery.isError ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 16 }}>지난 여행을 불러오지 못했어요.</div>
        ) : past.length === 0 ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 16 }}>지난 여행이 없어요.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {past.map((r) => (
              <TripCard key={r.reservationId} reservation={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active ? '1px solid var(--ink-1)' : '1px solid var(--line-strong)',
        borderRadius: 24,
        background: active ? 'var(--ink-1)' : '#fff',
        color: active ? '#fff' : 'var(--ink-1)',
        padding: '10px 20px',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'var(--surface-alt-2)';
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = '#fff';
      }}
    >
      {children}
    </button>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <section>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        {title} <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{count}</span>
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>{children}</div>
    </section>
  );
}

function TripCard({
  reservation: r,
  onCardClick,
  cta,
  busy,
}: {
  reservation: ReservationSummary;
  onCardClick?: () => void;
  cta?: string;
  busy?: boolean;
}) {
  const navigate = useNavigate();
  const { canceledIds } = useAppState();
  const [showTimeline, setShowTimeline] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const dates = rangeLabel(r.checkInDate, r.checkOutDate);
  const checkIn = dayMark(r.checkInDate);
  const checkOut = dayMark(r.checkOutDate);
  const isCanceled =
    r.state === 'GUEST_CANCELED' ||
    r.state === 'HOST_CANCELED' ||
    (r.reservationId != null && canceledIds.has(r.reservationId));
  const canReview = r.state === 'COMPLETED' && !isCanceled && r.reservationId != null;
  // 리뷰 작성 가능 잔여일(체크아웃+7일 기준). null이면 표시 생략
  const daysLeft = canReview ? reviewDaysLeft(r.checkOutDate) : null;
  const reviewClosed = daysLeft != null && daysLeft < 0;
  const stateLabel = busy
    ? '결제창 여는 중…'
    : isCanceled
      ? '취소됨'
      : r.state
        ? STATE_LABEL[r.state]
        : '';
  // onCardClick이 있으면(PENDING 결제 이어하기) 그걸, 없으면 기본은 상세 페이지로.
  const handleClick = onCardClick ?? (() => navigate(`/trips/reservation/${r.reservationId}`));

  return (
    <div>
      <div
        onClick={busy ? undefined : handleClick}
        style={{
          display: 'flex',
          gap: 32,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          padding: 20,
          cursor: busy ? 'default' : 'pointer',
          opacity: busy ? 0.6 : 1,
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

          {cta && (
            <div
              style={{
                marginTop: 8,
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--brand-coral)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {cta}
              <Icon name="chevron-right" size={16} color="var(--brand-coral)" />
            </div>
          )}

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
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              {canReview && reviewed && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--ink-3)' }}>
                  <Icon name="star" size={14} color="var(--ink-1)" fill="var(--ink-1)" />
                  후기 작성 완료
                </span>
              )}
              {canReview && !reviewed && !reviewClosed && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setWriteOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid var(--line-strong)',
                    borderRadius: 10,
                    background: '#fff',
                    padding: '12px 20px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--ink-1)',
                    transition: 'background 120ms ease, border-color 120ms ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--surface-alt-2)';
                    e.currentTarget.style.borderColor = 'var(--ink-1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = 'var(--line-strong)';
                  }}
                >
                  <Icon name="star" size={15} color="var(--ink-1)" fill="var(--ink-1)" />
                  리뷰 쓰기
                  {daysLeft != null && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--ink-3)',
                        border: '1px solid var(--line-strong)',
                        borderRadius: 20,
                        padding: '1px 8px',
                      }}
                    >
                      D-{daysLeft}
                    </span>
                  )}
                </button>
              )}
              {canReview && !reviewed && reviewClosed && (
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: 'var(--ink-3)' }}>
                  리뷰 작성 기간 종료
                </span>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (r.listingId != null) navigate(`/listings/${r.listingId}`);
                }}
                style={{
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

      {writeOpen && (
        <WriteReviewModal
          open
          reservationId={r.reservationId ?? null}
          listingTitle={r.listingTitle ?? undefined}
          onClose={() => setWriteOpen(false)}
          onSubmitted={() => {
            setReviewed(true);
            setWriteOpen(false);
          }}
        />
      )}
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
