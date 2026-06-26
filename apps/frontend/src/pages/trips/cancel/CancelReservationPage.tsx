import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import logoSvg from '../../../assets/logo.svg';
import { Icon } from '../../../shared/Icon';
import { useAppState } from '../../../shared/AppState';
import {
  getReservationOptions,
  cancelPreviewOptions,
} from '../../../shared/api/generated/@tanstack/react-query.gen';
import type { GuestCountsResponse } from '../../../shared/api/generated/types.gen';
import { cancelReservation as cancelReservationApi } from '../../../shared/api/reservation';
import { CancelSummaryCard } from './CancelSummaryCard';
import { SelectReasonStep, ConfirmStep, CANCEL_REASONS } from './steps';

const STEPS = ['사유 선택', '취소 확인'];

function shortDate(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function guestSummary(g: GuestCountsResponse | undefined): string {
  const people = (g?.adultGuestNum ?? 0) + (g?.childGuestNum ?? 0);
  if (people <= 0) return '게스트 1명';
  const parts = [`게스트 ${people}명`];
  if (g?.petGuestNum) parts.push(`반려동물 ${g.petGuestNum}마리`);
  return parts.join(', ');
}

export function CancelReservationPage() {
  const navigate = useNavigate();
  const { reservationId: idParam } = useParams();
  const reservationId = Number(idParam);
  const { selectedListing: listing, cancelReservation } = useAppState();

  const queryClient = useQueryClient();
  const enabled = Number.isFinite(reservationId);

  const detailQuery = useQuery({
    ...getReservationOptions({ path: { reservationId } }),
    enabled,
  });
  const detail = detailQuery.data?.data;

  const previewQuery = useQuery({
    ...cancelPreviewOptions({ path: { reservationId } }),
    enabled,
  });
  const refund = previewQuery.data?.data?.refundAmount ?? detail?.totalPrice;

  const cancelMutation = useMutation({
    mutationFn: () => {
      const label = CANCEL_REASONS.find((r) => r.value === reason)?.label ?? reason;
      return cancelReservationApi(reservationId, label);
    },
  });

  const title = detail?.listingTitle ?? listing.title;
  const hostName = detail?.hostName ?? 'airdnd';
  const total = detail?.totalPrice;
  const guests = guestSummary(detail?.guestCounts);
  const dateRange =
    detail?.checkInDate && detail?.checkOutDate
      ? `${shortDate(detail.checkInDate)} ~ ${shortDate(detail.checkOutDate)}`
      : '날짜 미정';

  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState('');
  const [dateChoice, setDateChoice] = useState<'yes' | 'no' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const canContinue =
    step === 1 ? reason !== '' && (reason !== 'DATE_CHANGE' || dateChoice === 'no') : true;

  const onBack = () => {
    if (step === 1) navigate(`/trips/reservation/${reservationId}`);
    else setStep((s) => (s - 1) as 1 | 2);
  };

  const onNext = () => {
    if (step < 2) setStep((s) => (s + 1) as 1 | 2);
  };

  const onConfirm = () => {
    cancelMutation.mutate(undefined, {
      onSuccess: () => {
        cancelReservation(reservationId); // 즉시 UI 반영
        queryClient.invalidateQueries();
        navigate(`/trips/reservation/${reservationId}`);
      },
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <CancelHeader step={step} />

      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '56px 48px 120px',
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 64,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 480 }}>
          <div style={{ flex: 1 }}>
            {step === 1 && (
              <SelectReasonStep
                reason={reason}
                setReason={setReason}
                dateChoice={dateChoice}
                setDateChoice={setDateChoice}
              />
            )}
            {step === 2 && <ConfirmStep total={total} refund={refund} />}
          </div>

          <Footer
            step={step}
            canContinue={canContinue}
            confirming={cancelMutation.isPending}
            onBack={onBack}
            onNext={onNext}
            onConfirm={() => setShowConfirm(true)}
          />
        </div>

        <CancelSummaryCard
          img={listing.img}
          title={title}
          hostName={hostName}
          dateRange={dateRange}
          guests={guests}
          total={total}
          refund={refund}
        />
      </div>

      {showConfirm && (
        <ConfirmModal
          confirming={cancelMutation.isPending}
          onClose={() => setShowConfirm(false)}
          onConfirm={onConfirm}
        />
      )}
    </div>
  );
}

function ConfirmModal({
  confirming,
  onClose,
  onConfirm,
}: {
  confirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: 'calc(100vw - 48px)',
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          boxShadow: 'var(--shadow-pop)',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>정말 예약을 취소하시겠어요?</div>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6, marginTop: 12 }}>
          취소하면 되돌릴 수 없으며, 환불은 안내된 정책에 따라 처리됩니다.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button
            onClick={onClose}
            disabled={confirming}
            style={{
              border: '1px solid var(--line-strong)',
              borderRadius: 10,
              background: '#fff',
              padding: '11px 20px',
              fontSize: 15,
              fontWeight: 600,
              cursor: confirming ? 'default' : 'pointer',
            }}
          >
            돌아가기
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            style={{
              border: 'none',
              borderRadius: 10,
              background: 'var(--brand-coral)',
              color: '#fff',
              padding: '11px 20px',
              fontSize: 15,
              fontWeight: 600,
              cursor: confirming ? 'default' : 'pointer',
              opacity: confirming ? 0.6 : 1,
            }}
          >
            {confirming ? '취소 중…' : '예약 취소하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelHeader({ step }: { step: number }) {
  const navigate = useNavigate();
  return (
    <header
      style={{
        height: 72,
        display: 'flex',
        alignItems: 'center',
        gap: 40,
        padding: '0 48px',
        borderBottom: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 40,
      }}
    >
      <img
        src={logoSvg}
        alt="airdnd"
        onClick={() => navigate('/')}
        style={{ height: 38, cursor: 'pointer' }}
      />
      <nav style={{ display: 'flex', gap: 18, fontSize: 14 }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span
                style={{
                  fontWeight: n === step ? 700 : 500,
                  color: n <= step ? 'var(--ink-1)' : 'var(--ink-3)',
                }}
              >
                {n}. {label}
              </span>
              {n < STEPS.length && <span style={{ color: 'var(--ink-4)' }}>›</span>}
            </span>
          );
        })}
      </nav>
    </header>
  );
}

function Footer({
  step,
  canContinue,
  confirming,
  onBack,
  onNext,
  onConfirm,
}: {
  step: 1 | 2;
  canContinue: boolean;
  confirming: boolean;
  onBack: () => void;
  onNext: () => void;
  onConfirm: () => void;
}) {
  const isLast = step === 2;
  return (
    <div style={{ marginTop: 32 }}>
      {/* 진행 바 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[1, 2].map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: n <= step ? 'var(--ink-1)' : 'var(--line)',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          <Icon name="chevron-left" size={18} /> 뒤로
        </button>

        <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{step}/2</span>

        {isLast ? (
          <button
            onClick={onConfirm}
            disabled={confirming}
            style={{
              border: 'none',
              borderRadius: 10,
              background: 'var(--ink-1)',
              color: '#fff',
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: confirming ? 'default' : 'pointer',
              opacity: confirming ? 0.6 : 1,
            }}
          >
            {confirming ? '취소 중…' : '예약 취소'}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canContinue}
            style={{
              border: 'none',
              borderRadius: 10,
              background: canContinue ? 'var(--ink-1)' : 'var(--line)',
              color: canContinue ? '#fff' : 'var(--ink-3)',
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: canContinue ? 'pointer' : 'default',
            }}
          >
            계속
          </button>
        )}
      </div>
    </div>
  );
}
