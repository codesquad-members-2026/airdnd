import type { RefObject } from 'react';
import type { ListingFormData } from '../../../../types';
import type { ListingFormErrors, SetListingFormValue } from '../types';

const MAX = 50;

export function BasicInfoStep({
  form,
  errors,
  titleInputRef,
  setField,
}: {
  form: ListingFormData;
  errors: ListingFormErrors;
  titleInputRef: RefObject<HTMLInputElement | null>;
  setField: SetListingFormValue;
}) {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, marginBottom: 8 }}>
        이제 숙소 이름을 지어주세요
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 28 }}>
        짧은 이름이 가장 좋습니다. 나중에 언제든 바꿀 수 있어요.
      </p>

      <input
        ref={titleInputRef}
        maxLength={MAX}
        placeholder="게스트에게 표시될 숙소 이름"
        value={form.title}
        onChange={e => setField('title', e.target.value)}
        style={{
          width: '100%',
          padding: '20px',
          borderRadius: 14,
          border: `1px solid ${errors.title ? 'var(--brand-coral)' : 'var(--line-strong)'}`,
          fontSize: 22,
          fontFamily: 'var(--font-sans)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontSize: 13, color: 'var(--brand-coral)' }}>{errors.title ?? ''}</span>
        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          {form.title.length}/{MAX}
        </span>
      </div>
    </div>
  );
}
