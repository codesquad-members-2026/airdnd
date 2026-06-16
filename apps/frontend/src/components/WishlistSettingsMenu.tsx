import { useEffect } from 'react';
import { Icon } from '../shared/Icon';

interface WishlistSettingsMenuProps {
  open: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

/**
 * 위시리스트 상세 우측 상단 "..." 의 "환경설정" 팝오버.
 * 이름 변경 / 삭제 두 항목만 노출한다.
 * 부모는 position:relative 컨테이너 안에 "..." 버튼과 함께 이 컴포넌트를 둔다.
 */
export function WishlistSettingsMenu({ open, onClose, onRename, onDelete }: WishlistSettingsMenuProps) {
  // ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* 바깥 클릭 닫기용 투명 백드롭 */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 150 }} />

      <div
        role="menu"
        aria-label="환경설정"
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 340,
          background: '#fff',
          borderRadius: 16,
          boxShadow: 'var(--shadow-pop)',
          zIndex: 151,
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 18px',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-1)' }}>환경설정</span>
          <button
            aria-label="닫기"
            onClick={onClose}
            style={{
              position: 'absolute', right: 12,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, display: 'flex', color: 'var(--ink-1)',
            }}
          >
            <Icon name="x" size={20} />
          </button>
        </header>

        <MenuRow icon="pencil" label="이름 변경" onClick={onRename} />
        <MenuRow icon="trash-2" label="삭제" onClick={onDelete} />
      </div>
    </>
  );
}

function MenuRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="wl-menu-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', padding: '16px 20px',
        border: 'none', borderTop: '1px solid var(--line-soft)',
        background: '#fff', cursor: 'pointer', textAlign: 'left',
        fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--ink-1)',
      }}
    >
      <Icon name={icon} size={20} color="var(--ink-1)" />
      <span style={{ flex: 1 }}>{label}</span>
      <Icon name="chevron-right" size={18} color="var(--ink-3)" />
    </button>
  );
}
