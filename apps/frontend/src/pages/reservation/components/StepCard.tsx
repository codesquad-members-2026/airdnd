interface StepCardProps {
  title: string;
  collapsed?: boolean;
  subtitle?: string;
  onChange?: () => void;
  children?: React.ReactNode;
}

export function StepCard({ title, collapsed, subtitle, onChange, children }: StepCardProps) {
  return (
    <section
      style={{
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        boxShadow: collapsed ? 'none' : 'var(--shadow-lg)',
        transition: 'box-shadow 200ms ease',
      }}
    >
      {collapsed ? (
        <div
          key="collapsed"
          className="step-reveal"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 6 }}>{subtitle}</div>
            )}
          </div>
          {onChange && (
            <button
              onClick={onChange}
              style={{
                border: 'none',
                borderRadius: 8,
                background: 'var(--surface-alt-2)',
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--ink-1)',
              }}
            >
              변경
            </button>
          )}
        </div>
      ) : (
        <div key="expanded" className="step-reveal">
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{title}</div>
          {children}
        </div>
      )}
    </section>
  );
}
