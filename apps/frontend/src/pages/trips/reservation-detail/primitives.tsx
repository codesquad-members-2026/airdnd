import { useState, type ReactNode } from 'react';
import { Icon } from '../../../shared/Icon';

export function Section({
  title,
  action,
  id,
  children,
}: {
  title: string;
  action?: ReactNode;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        marginTop: 40,
        paddingTop: 36,
        borderTop: '1px solid var(--line)',
        scrollMarginTop: 96,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function ExpandableText({ text, clamp = 3 }: { text: string; clamp?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 22 }}>
      <p
        style={{
          fontSize: 15,
          color: 'var(--ink-2)',
          lineHeight: 1.6,
          margin: 0,
          display: open ? 'block' : '-webkit-box',
          WebkitLineClamp: open ? 'unset' : clamp,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {text}
      </p>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          marginTop: 8,
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink-1)',
          textDecoration: 'underline',
        }}
      >
        {open ? '접기' : '더 보기'}
      </button>
    </div>
  );
}

export function LinkRow({
  icon,
  label,
  onClick,
}: {
  icon?: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        padding: '16px 0',
        borderTop: '1px solid var(--line)',
      }}
    >
      {icon && <Icon name={icon} size={22} color="var(--ink-2)" />}
      <div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{label}</div>
      <Icon name="chevron-right" size={20} color="var(--ink-3)" />
    </button>
  );
}
