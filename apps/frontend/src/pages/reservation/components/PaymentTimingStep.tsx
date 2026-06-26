import { won } from '../../../shared/utils';
import { PayRow } from './PayRow';
import { StepCard } from './StepCard';

export type PayOption = 'now' | 'split';

interface PaymentTimingStepProps {
  open: boolean;
  done: boolean;
  total: number;
  payNow: number;
  payLater: number;
  payOption: PayOption;
  onSelect: (option: PayOption) => void;
  onNext: () => void;
  onChangeStep: () => void;
}

export function PaymentTimingStep({
  open,
  done,
  total,
  payNow,
  payLater,
  payOption,
  onSelect,
  onNext,
  onChangeStep,
}: PaymentTimingStepProps) {
  if (!open) {
    const summary = payOption === 'now' ? `지금 ${won(total)} 결제` : `지금 ${won(payNow)} 결제`;
    return (
      <StepCard
        title="1. 결제 시기 선택"
        collapsed
        subtitle={done ? summary : undefined}
        onChange={done ? onChangeStep : undefined}
      />
    );
  }

  return (
    <StepCard title="1. 결제 시기 선택">
      <PayRow
        selected={payOption === 'now'}
        onClick={() => onSelect('now')}
        title={`지금 ${won(total)} 결제`}
      />
      <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
      <PayRow
        selected={payOption === 'split'}
        onClick={() => onSelect('split')}
        title="일부 지금, 일부 나중에 결제"
        subtitle={
          <>
            지금 {won(payNow)} 결제, 나머지 {won(payLater)}는 체크인 전 청구. 추가 수수료 없음.{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>추가 정보</span>
          </>
        }
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button
          onClick={onNext}
          style={{
            height: 48,
            padding: '0 26px',
            border: 'none',
            borderRadius: 10,
            background: 'var(--cta-dark)',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          다음
        </button>
      </div>
    </StepCard>
  );
}
