import { Icon } from '../../../../shared/Icon';
import { AMENITIES } from '../constants';
import { amenityIcon } from '../../../../shared/amenities';
import type { ListingFormData } from '../../../../types';

export function AmenitiesStep({
  form,
  onToggleAmenity,
}: {
  form: ListingFormData;
  onToggleAmenity: (amenity: string) => void;
}) {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, marginBottom: 8 }}>
        어떤 편의시설을 제공하나요?
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 28 }}>
        제공하는 편의시설을 모두 선택해주세요.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {AMENITIES.map(a => {
          const checked = form.amenities.includes(a);
          return (
            <button
              key={a}
              onClick={() => onToggleAmenity(a)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                alignItems: 'flex-start',
                padding: '18px 16px',
                borderRadius: 14,
                border: `2px solid ${checked ? 'var(--ink-1)' : 'var(--line-strong)'}`,
                background: checked ? 'var(--surface-alt-2)' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 120ms ease',
              }}
            >
              <Icon name={amenityIcon(a)} size={26} color="var(--ink-1)" />
              <span style={{ fontSize: 15, fontWeight: checked ? 700 : 500 }}>{a}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
