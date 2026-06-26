import { useNavigate } from 'react-router-dom';
import logoSvg from '../../../assets/logo.svg';

export function SlimHeader() {
  const navigate = useNavigate();
  const onLogo = () => navigate('/');
  return (
    <header
      style={{
        height: 80,
        display: 'flex',
        alignItems: 'center',
        padding: '0 48px',
        borderBottom: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        background: 'var(--surface)',
        zIndex: 40,
      }}
    >
      <img
        src={logoSvg}
        alt="airdnd"
        onClick={onLogo}
        style={{ height: 44, cursor: 'pointer', display: 'block' }}
      />
    </header>
  );
}
