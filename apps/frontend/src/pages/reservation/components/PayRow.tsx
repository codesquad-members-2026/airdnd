import { RadioDot } from './RadioDot';

interface PayRowProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: React.ReactNode;
}

export function PayRow({ selected, onClick, title, subtitle }: PayRowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 0',
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 5, lineHeight: 1.5 }}>{subtitle}</div>
        )}
      </div>
      <RadioDot selected={selected} />
    </div>
  );
}
