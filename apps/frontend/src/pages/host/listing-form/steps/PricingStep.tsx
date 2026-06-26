import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Icon } from '../../../../shared/Icon';
import { formatCurrency, parseCurrencyInput } from '../formatters';
import type { ListingFormData } from '../../../../types';
import type { ListingFormErrors, SetListingFormValue } from '../types';

const AMOUNT_FONT: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: 64,
};

export function PricingStep({
  form,
  errors,
  priceInputRef,
  setField,
}: {
  form: ListingFormData;
  errors: ListingFormErrors;
  priceInputRef: RefObject<HTMLInputElement | null>;
  setField: SetListingFormValue;
}) {
  const display = formatCurrency(form.price) || '0';
  const sizerRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(0);

  useLayoutEffect(() => {
    if (sizerRef.current) setInputWidth(sizerRef.current.offsetWidth);
  }, [display]);

  return (
    <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, marginBottom: 8 }}>
        1박 기본 요금을 설정하세요
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 48 }}>
        언제든 변경할 수 있어요.
      </p>

      <div
        onClick={() => priceInputRef.current?.focus()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          ...AMOUNT_FONT,
          cursor: 'text',
        }}
      >
        <span style={{ marginRight: 8 }}>₩</span>
        <input
            ref={priceInputRef}
            inputMode="numeric"
            placeholder="0"
            value={formatCurrency(form.price)}
            onChange={e => setField('price', parseCurrencyInput(e.target.value))}
            style={{
              ...AMOUNT_FONT,
              border: 'none',
              outline: 'none',
              color: 'var(--ink-1)',
              background: 'transparent',
              width: inputWidth,
              textAlign: 'right',
              padding: 0,
            }}
          />
          {/* 폭 측정용 숨은 sizer */}
          <span
            ref={sizerRef}
            aria-hidden
            style={{
              ...AMOUNT_FONT,
              position: 'absolute',
              visibility: 'hidden',
              whiteSpace: 'pre',
              pointerEvents: 'none',
            }}
          >
            {display}
          </span>
        <button
          onClick={e => {
            e.stopPropagation();
            priceInputRef.current?.focus();
          }}
          aria-label="요금 수정"
          style={{
            marginLeft: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid var(--line-strong)',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="pencil" size={16} color="var(--ink-1)" />
        </button>
      </div>

      <div style={{ fontSize: 14, color: 'var(--brand-coral)', marginTop: 16, minHeight: 18 }}>
        {errors.price ?? ''}
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
        수수료 및 세금은 별도로 부과됩니다.
      </p>
    </div>
  );
}
