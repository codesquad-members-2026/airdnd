import { useState } from 'react';
import { Icon } from '../../../shared/Icon';
import { StepCard } from './StepCard';
import { RadioDot } from './RadioDot';

type Method = 'card' | 'paypal' | 'applepay' | 'googlepay';

interface PaymentMethodStepProps {
  open: boolean;
  done: boolean;
  onNext: () => void;
  onChangeStep: () => void;
}

export function PaymentMethodStep({ open, done, onNext, onChangeStep }: PaymentMethodStepProps) {
  const [method, setMethod] = useState<Method>('card');
  const [card, setCard] = useState({ number: '', exp: '', cvc: '', zip: '' });

  if (!open) {
    return (
      <StepCard
        title="2. 결제 수단 추가"
        collapsed
        subtitle={done ? '신용카드 또는 체크카드' : undefined}
        onChange={done ? onChangeStep : undefined}
      />
    );
  }

  return (
    <StepCard title="2. 결제 수단 추가">
      {/* 신용/체크카드 */}
      <div
        onClick={() => setMethod('card')}
        style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', paddingBottom: 16 }}
      >
        <Icon name="credit-card" size={26} color="var(--ink-2)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>신용카드 또는 체크카드</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {['VISA', 'MC', 'AMEX', 'DISCOVER'].map(b => (
              <CardBrand key={b} label={b} />
            ))}
          </div>
        </div>
        <RadioDot selected={method === 'card'} />
      </div>

      {method === 'card' && (
        <div style={{ marginBottom: 24 }}>
          {/* 카드 번호 / 유효기간·CVC */}
          <div style={{ border: '1px solid var(--line-strong)', borderRadius: 10, overflow: 'hidden' }}>
            <CardInput
              label="카드 번호"
              lock
              value={card.number}
              onChange={v => setCard({ ...card, number: v })}
              placeholder="1234 5678 9012 3456"
            />
            <div style={{ display: 'flex', borderTop: '1px solid var(--line-strong)' }}>
              <div style={{ flex: 1, borderRight: '1px solid var(--line-strong)' }}>
                <CardInput
                  label="유효기간"
                  value={card.exp}
                  onChange={v => setCard({ ...card, exp: v })}
                  placeholder="MM / YY"
                />
              </div>
              <div style={{ flex: 1 }}>
                <CardInput
                  label="CVC"
                  value={card.cvc}
                  onChange={v => setCard({ ...card, cvc: v })}
                  placeholder="CVC"
                />
              </div>
            </div>
          </div>

          {/* 우편번호 */}
          <div style={{ border: '1px solid var(--line-strong)', borderRadius: 10, marginTop: 14 }}>
            <CardInput
              label="우편번호"
              value={card.zip}
              onChange={v => setCard({ ...card, zip: v })}
              placeholder="우편번호"
            />
          </div>

          {/* 국가/지역 */}
          <div
            style={{
              border: '1px solid var(--line-strong)',
              borderRadius: 10,
              marginTop: 14,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>국가/지역</div>
              <div style={{ fontSize: 15, marginTop: 2 }}>대한민국</div>
            </div>
            <Icon name="chevron-down" size={18} color="var(--ink-3)" />
          </div>
        </div>
      )}

      {/* 하드코딩 결제수단 */}
      <MethodRow
        label="PayPal"
        icon={<BrandText text="Pay" color="#003087" />}
        selected={method === 'paypal'}
        onClick={() => setMethod('paypal')}
      />
      <MethodRow
        label="Apple Pay"
        icon={<BrandText text="Pay" color="#000" />}
        selected={method === 'applepay'}
        onClick={() => setMethod('applepay')}
      />
      <MethodRow
        label="Google Pay"
        icon={<BrandText text="GPay" color="#5f6368" />}
        selected={method === 'googlepay'}
        onClick={() => setMethod('googlepay')}
        last
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

function CardInput({
  label,
  value,
  onChange,
  placeholder,
  lock,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  lock?: boolean;
}) {
  return (
    <label style={{ display: 'block', padding: '8px 14px', cursor: 'text' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-3)' }}>
        {label}
        {lock && <Icon name="shield" size={12} color="var(--ink-3)" />}
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          fontSize: 15,
          marginTop: 2,
          background: 'transparent',
          fontFamily: 'var(--font-sans)',
        }}
      />
    </label>
  );
}

function MethodRow({
  label,
  icon,
  selected,
  onClick,
  last,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '18px 0',
        borderTop: '1px solid var(--line)',
        borderBottom: last ? '1px solid var(--line)' : 'none',
        cursor: 'pointer',
      }}
    >
      <span style={{ width: 28, display: 'flex', justifyContent: 'center' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{label}</span>
      <RadioDot selected={selected} />
    </div>
  );
}

function CardBrand({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 0.3,
        color: 'var(--ink-2)',
        border: '1px solid var(--line-strong)',
        borderRadius: 3,
        padding: '1px 4px',
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}

function BrandText({ text, color }: { text: string; color: string }) {
  return <span style={{ fontSize: 13, fontWeight: 800, color }}>{text}</span>;
}
