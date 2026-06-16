import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { SlimHeader } from './components/SlimHeader';
import { PaymentTimingStep, type PayOption } from './components/PaymentTimingStep';
import { PaymentMethodStep } from './components/PaymentMethodStep';
import { ReviewStep } from './components/ReviewStep';
import { ReservationSummary } from './components/ReservationSummary';
import { PaymentModal, type PayStatus } from './components/PaymentModal';
import { createReservationMutation } from '../../shared/api/generated/@tanstack/react-query.gen';
import { GUEST_STUB, toReservationRequest, reservationErrorMessage } from '../../shared/api/reservationMapping';
import { Icon } from '../../shared/Icon';
import { nightsOf } from './utils';
import { LISTINGS } from '../Results';
import { useAppState } from '../../shared/AppState';

export function Checkout() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { search, setSearch, selectedListing } = useAppState();
  const listing = LISTINGS.find((item) => String(item.id) === id) ?? selectedListing;
  const onChange = setSearch;
  const onBack = () => navigate(`/listings/${listing.id}`);
  const onConfirm = () => navigate(`/listings/${listing.id}/pending`, { state: { fromCheckout: true } });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [payOption, setPayOption] = useState<PayOption>('now');
  const [payStatus, setPayStatus] = useState<PayStatus | null>(null);
  const [payError, setPayError] = useState<string>('');
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const reserveMutation = useMutation(createReservationMutation());

  function handleConfirm() {
    let body;
    try {
      body = toReservationRequest(search);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : '예약 정보를 확인해주세요.');
      setPayStatus('fail');
      return;
    }
    setPayStatus('loading');
    reserveMutation.mutate(
      { path: { listingId: listing.id }, query: { guest: GUEST_STUB }, body },
      {
        onSuccess: () => {
          setPayStatus('success');
          timers.current.push(window.setTimeout(() => onConfirm(), 1400));
        },
        onError: (err) => {
          setPayError(reservationErrorMessage(err));
          setPayStatus('fail');
        },
      },
    );
  }

  const nights = nightsOf(search);
  const roomTotal = listing.price * nights;
  const total = roomTotal;
  const payNow = Math.round(total / 2);
  const payLater = total - payNow;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <SlimHeader />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 48px 80px 160px' }}>
        {/* 스크롤 시 좌측에 고정되는 뒤로가기 버튼 */}
        <div style={{ position: 'sticky', top: 96, height: 0, zIndex: 30 }}>
          <button
            onClick={onBack}
            aria-label="뒤로"
            style={{
              marginLeft: -64,
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--surface-alt-2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 120ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--line)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
          >
            <Icon name="chevron-left" size={22} />
          </button>
        </div>

        {/* 타이틀 */}
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, marginBottom: 36 }}>
          확인 및 결제
        </h1>

        <div style={{ display: 'flex', gap: 64, alignItems: 'flex-start' }}>
          {/* 좌측: 단계 아코디언 */}
          <div style={{ flex: 1, maxWidth: 480 }}>
            <PaymentTimingStep
              open={step === 1}
              done={step > 1}
              total={total}
              payNow={payNow}
              payLater={payLater}
              payOption={payOption}
              onSelect={setPayOption}
              onNext={() => setStep(2)}
              onChangeStep={() => setStep(1)}
            />
            <PaymentMethodStep
              open={step === 2}
              done={step > 2}
              onNext={() => setStep(3)}
              onChangeStep={() => setStep(2)}
            />
            <ReviewStep open={step === 3} onConfirm={handleConfirm} />
          </div>

          {/* 우측: 예약 요약 */}
          <aside style={{ flex: '0 0 400px', position: 'sticky', top: 112 }}>
            <ReservationSummary
              listing={listing}
              nights={nights}
              roomTotal={roomTotal}
              total={total}
              search={search}
              onChange={onChange}
            />
          </aside>
        </div>
      </div>

      {payStatus && (
        <PaymentModal
          status={payStatus}
          errorMessage={payError}
          onClose={onBack}
        />
      )}
    </div>
  );
}
