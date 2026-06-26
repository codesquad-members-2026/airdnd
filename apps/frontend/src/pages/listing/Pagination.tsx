import { Icon } from '../../shared/Icon';

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  // 현재 페이지 주변 ±2만 노출
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  const end = Math.min(totalPages, start + 5);
  const nums = Array.from({ length: end - start }, (_, i) => start + i);

  const btn = (active: boolean): React.CSSProperties => ({
    minWidth: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: active ? 'var(--ink-1)' : 'transparent',
    color: active ? '#fff' : 'var(--ink-1)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40 }}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        style={{ ...btn(false), opacity: page === 0 ? 0.3 : 1, cursor: page === 0 ? 'default' : 'pointer' }}
        aria-label="이전 페이지"
      >
        <Icon name="chevron-left" size={18} />
      </button>
      {nums.map(n => (
        <button key={n} onClick={() => onChange(n)} style={btn(n === page)}>
          {n + 1}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        style={{ ...btn(false), opacity: page >= totalPages - 1 ? 0.3 : 1, cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}
        aria-label="다음 페이지"
      >
        <Icon name="chevron-right" size={18} />
      </button>
    </div>
  );
}
