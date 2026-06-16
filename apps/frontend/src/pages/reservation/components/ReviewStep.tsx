import { useState } from 'react';
import { Icon } from '../../../shared/Icon';
import { won } from '../../../shared/utils';
import { StepCard } from './StepCard';

const INSURANCE_PRICE = 20000;

const COVERED = ['질병 또는 부상', '기상 악화', '여행 지연'];

interface ReviewStepProps {
  open: boolean;
  onConfirm: () => void;
}

export function ReviewStep({ open, onConfirm }: ReviewStepProps) {
  const [insurance, setInsurance] = useState(false);

  if (!open) {
    return <StepCard title="3. 예약 정보 확인" collapsed />;
  }

  return (
    <StepCard title="3. 예약 정보 확인">
      {/* 여행자 보험 */}
      <div style={{ background: 'var(--surface-alt-2)', borderRadius: 14, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>여행자 보험을 추가할까요?</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>네, {won(INSURANCE_PRICE)}으로 안심을 더하세요</div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>
              보장 사유 발생 시 최대 100% 환급받을 수 있어요.
            </div>
          </div>
          <button
            onClick={() => setInsurance(v => !v)}
            aria-label="여행자 보험 선택"
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: 6,
              border: insurance ? 'none' : '2px solid var(--line-strong)',
              background: insurance ? 'var(--cta-dark)' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 120ms ease',
            }}
          >
            {insurance && <Icon name="check" size={16} color="#fff" />}
          </button>
        </div>

        <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 20, marginBottom: 12 }}>
          아래와 같은 사유로 취소하면 환급받을 수 있어요:
        </div>
        {COVERED.map(c => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
            <Icon name="check" size={16} color="var(--ink-2)" />
            <span style={{ fontSize: 14 }}>{c}</span>
          </div>
        ))}

        <div style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, marginTop: 16 }}>
          긴급 지원 등 지원 서비스가 포함됩니다. Generali 제공.<br />
          <span style={{ color: 'var(--ink-1)', textDecoration: 'underline', cursor: 'pointer' }}>보장 내용</span>
        </div>
      </div>

      {/* 약관 + CTA */}
      <div style={{ fontSize: 13, color: 'var(--ink-2)', margin: '24px 0 16px', fontWeight: 600 }}>
        버튼을 누르면{' '}
        <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>예약 약관</span>에 동의하는 것입니다.
      </div>
      <button
        onClick={onConfirm}
        style={{
          width: '100%',
          height: 54,
          border: 'none',
          borderRadius: 12,
          background: 'linear-gradient(90deg, #E84C60, #D43A4E)',
          color: '#fff',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 17,
          cursor: 'pointer',
        }}
      >
        확인 및 결제
      </button>
    </StepCard>
  );
}
