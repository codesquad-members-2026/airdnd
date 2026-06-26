import { Icon } from '../shared/Icon';

interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

// 지도 우상단 +/- 줌 컨트롤 (결과 지도/상세 지도 공용)
export function MapZoomControls({ onZoomIn, onZoomOut }: MapZoomControlsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRadius: 10,
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}
    >
      <ZoomButton icon="plus" onClick={onZoomIn} />
      <div style={{ height: 1, background: 'var(--line)' }} />
      <ZoomButton icon="minus" onClick={onZoomOut} />
    </div>
  );
}

function ZoomButton({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        border: 'none',
        background: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
