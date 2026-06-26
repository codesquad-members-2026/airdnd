import { useState } from 'react';
import { Icon } from '../../shared/Icon';
import { ALL_AMENITIES, amenityIcon } from '../../shared/amenities';

interface DetailAmenitiesProps {
  provided: string[]; // 이 숙소가 제공하는 어메니티
}

// 레퍼런스: "숙소 편의시설" — 아이콘+라벨 2열, 미제공 항목 취소선, N개 모두 보기 모달
export function DetailAmenities({ provided }: DetailAmenitiesProps) {
  const [open, setOpen] = useState(false);
  const providedSet = new Set(provided);
  // 미리보기: 제공 항목 먼저, 부족하면 미제공으로 채워 최대 8개
  const preview = [
    ...provided,
    ...ALL_AMENITIES.filter((a) => !providedSet.has(a)),
  ].slice(0, 8);

  return (
    <div style={{ padding: '40px 0', borderTop: '1px solid var(--line)' }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>숙소 편의시설</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 18, columnGap: 24 }}>
        {preview.map((a) => (
          <AmenityRow key={a} name={a} available={providedSet.has(a)} />
        ))}
      </div>

      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: 32,
          height: 48,
          padding: '0 24px',
          border: '1px solid var(--ink-1)',
          borderRadius: 10,
          background: '#fff',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink-1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
      >
        편의시설 {ALL_AMENITIES.length}개 모두 보기
      </button>

      {open && <AmenitiesModal providedSet={providedSet} onClose={() => setOpen(false)} />}
    </div>
  );
}

function AmenityRow({ name, available }: { name: string; available: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '4px 0',
        color: available ? 'var(--ink-1)' : 'var(--ink-3)',
      }}
    >
      <Icon name={amenityIcon(name)} size={24} color={available ? 'var(--ink-1)' : 'var(--ink-3)'} />
      <span style={{ fontSize: 15, textDecoration: available ? 'none' : 'line-through' }}>{name}</span>
    </div>
  );
}

function AmenitiesModal({ providedSet, onClose }: { providedSet: Set<string>; onClose: () => void }) {
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 720,
          maxWidth: '92vw',
          maxHeight: '86vh',
          background: '#fff',
          borderRadius: 16,
          boxShadow: 'var(--shadow-pop)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 24,
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              position: 'absolute',
              left: 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 32px 32px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '16px 0 8px' }}>제공되는 편의시설</h3>
          {ALL_AMENITIES.map((a) => (
            <div
              key={a}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 0',
                borderBottom: '1px solid var(--line)',
                color: providedSet.has(a) ? 'var(--ink-1)' : 'var(--ink-3)',
              }}
            >
              <Icon name={amenityIcon(a)} size={24} color={providedSet.has(a) ? 'var(--ink-1)' : 'var(--ink-3)'} />
              <span style={{ fontSize: 15, textDecoration: providedSet.has(a) ? 'none' : 'line-through' }}>
                {a}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
