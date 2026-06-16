import logoSvg from '../assets/logo.svg';

interface HostHeaderProps {
  title?: string;
  onLogo: () => void;
  action?: React.ReactNode;
}

export function HostHeader({ title, onLogo, action }: HostHeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        padding: '0 48px',
        background: '#fff',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <img
        src={logoSvg}
        alt="airdnd"
        onClick={onLogo}
        style={{ height: 44, cursor: 'pointer', display: 'block', flexShrink: 0 }}
      />

      {title && (
        <span
          style={{
            marginLeft: 24,
            fontSize: 15,
            color: 'var(--ink-3)',
            paddingLeft: 24,
            borderLeft: '1px solid var(--line)',
            fontWeight: 500,
          }}
        >
          {title}
        </span>
      )}

      {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
    </header>
  );
}
