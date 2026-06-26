import type { RefObject } from 'react';
import type { ListingFormData } from '../../../../types';
import type { ListingFormErrors, SetListingFormValue } from '../types';

const MAX = 500;

export function DescriptionStep({
  form,
  errors,
  descriptionInputRef,
  setField,
}: {
  form: ListingFormData;
  errors: ListingFormErrors;
  descriptionInputRef: RefObject<HTMLTextAreaElement | null>;
  setField: SetListingFormValue;
}) {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, marginBottom: 8 }}>
        숙소 설명을 작성해주세요
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 28 }}>
        숙소만의 매력을 알려주세요.
      </p>

      <textarea
        ref={descriptionInputRef}
        maxLength={MAX}
        placeholder="예) 남향 창으로 햇빛이 잘 드는 조용한 숙소입니다. 지하철역까지 도보 5분, 주변에 편의점과 카페가 가까워요."
        value={form.description}
        onChange={e => setField('description', e.target.value)}
        style={{
          width: '100%',
          minHeight: 180,
          padding: 20,
          borderRadius: 14,
          border: `1px solid ${errors.description ? 'var(--brand-coral)' : 'var(--line-strong)'}`,
          fontSize: 16,
          lineHeight: 1.6,
          fontFamily: 'var(--font-sans)',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 10 }}>
        {form.description.length}/{MAX}
      </div>
    </div>
  );
}
