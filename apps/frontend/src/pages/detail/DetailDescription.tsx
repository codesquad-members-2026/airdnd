import { useState } from 'react';
import { Icon } from '../../shared/Icon';

interface DetailDescriptionProps {
  description: string;
  maxChars?: number;
}

// 설명을 일정 글자까지만 보여주고, 더 보기 → 전체 모달
export function DetailDescription({ description, maxChars = 220 }: DetailDescriptionProps) {
  const [open, setOpen] = useState(false);
  const truncated = description.length > maxChars;
  const preview = truncated ? description.slice(0, maxChars).trimEnd() + '…' : description;

  return (
    <div style={{ padding: '24px 0', borderBottom: '1px solid var(--line)' }}>
      <p style={{ fontSize: 15, color: 'var(--ink-1)', lineHeight: 1.9, whiteSpace: 'pre-line', margin: 0 }}>
        {preview}
      </p>

      {truncated && (
        <button
          onClick={() => setOpen(true)}
          style={{
            marginTop: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--ink-1)',
            textDecoration: 'underline',
          }}
        >
          더 보기
          <Icon name="chevron-right" size={16} />
        </button>
      )}

      {open && <DescriptionModal description={description} onClose={() => setOpen(false)} />}
    </div>
  );
}

function DescriptionModal({ description, onClose }: { description: string; onClose: () => void }) {
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

        <div style={{ padding: '24px 32px 32px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>숙소 설명</h3>
          <p style={{ fontSize: 15, color: 'var(--ink-1)', lineHeight: 1.9, whiteSpace: 'pre-line', margin: 0 }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
