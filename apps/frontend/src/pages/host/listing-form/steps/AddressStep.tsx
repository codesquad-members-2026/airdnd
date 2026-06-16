import type { ListingFormData } from '../../../../types';
import type { ListingFormErrors } from '../types';

export function AddressStep({
  form,
  errors,
  isEdit,
  onSearchAddress,
  onDetailAddressChange,
}: {
  form: ListingFormData;
  errors: ListingFormErrors;
  isEdit: boolean;
  onSearchAddress: () => void;
  onDetailAddressChange: (value: string) => void;
}) {
  const addrError = errors.streetAddress || errors.zipCode;
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, marginBottom: 8 }}>
        주소를 확인해주세요
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 28 }}>
        주소는 게스트가 예약을 완료한 후에만 공유됩니다.
      </p>

      <button
        type="button"
        onClick={onSearchAddress}
        style={{
          width: '100%',
          height: 52,
          borderRadius: 12,
          border: '1px solid var(--line-strong)',
          background: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 16,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
      >
        주소 검색
      </button>

      {/* 레퍼런스처럼 셀이 묶인 단일 박스 */}
      <div
        style={{
          border: `1px solid ${addrError || errors.detailAddress ? 'var(--brand-coral)' : 'var(--line-strong)'}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Cell label="우편번호" value={form.zipCode} placeholder="주소 검색 후 자동 입력" readOnly />
        <Divider />
        <Cell label="도로명 주소" value={form.streetAddress} placeholder="주소 검색 후 자동 입력" readOnly />
        {(form.city || form.district) && (
          <>
            <Divider />
            <Cell label="지역" value={[form.city, form.district].filter(Boolean).join(' ')} readOnly />
          </>
        )}
        <Divider />
        <Cell
          label="상세 주소 (동·호수 등)"
          value={form.detailAddress}
          placeholder="예) 101동 1502호"
          onChange={onDetailAddressChange}
        />
      </div>

      {(addrError || errors.detailAddress) && (
        <div style={{ fontSize: 13, color: 'var(--brand-coral)', marginTop: 8 }}>
          {addrError || errors.detailAddress}
        </div>
      )}

      {isEdit && (
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
          수정 시 주소 변경은 지원되지 않습니다.
        </div>
      )}
    </div>
  );
}

function Cell({
  label,
  value,
  placeholder,
  readOnly,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 2 }}>{label}</div>
      <input
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 16,
          fontFamily: 'var(--font-sans)',
          color: 'var(--ink-1)',
          cursor: readOnly ? 'default' : 'text',
        }}
      />
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--line)' }} />;
}
