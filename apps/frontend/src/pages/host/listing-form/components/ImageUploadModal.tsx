import { useState } from 'react';
import { Icon } from '../../../../shared/Icon';

export function ImageUploadModal({
  onAdd,
  onClose,
}: {
  onAdd: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  const valid = url.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    onAdd(url.trim());
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480,
          maxWidth: 'calc(100vw - 48px)',
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          boxShadow: 'var(--shadow-pop)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>사진 추가</div>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* 미리보기 */}
        <div
          style={{
            aspectRatio: '16 / 9',
            borderRadius: 12,
            background: 'var(--surface-alt-2)',
            border: '1px solid var(--line)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          {valid ? (
            <img
              src={url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
            />
          ) : (
            <Icon name="image" size={40} color="var(--line-strong)" />
          )}
        </div>

        <input
          autoFocus
          className="host-input"
          placeholder="이미지 URL을 붙여넣으세요"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              border: '1px solid var(--line-strong)',
              borderRadius: 10,
              background: '#fff',
              padding: '11px 20px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            style={{
              border: 'none',
              borderRadius: 10,
              background: valid ? 'var(--ink-1)' : 'var(--line)',
              color: valid ? '#fff' : 'var(--ink-3)',
              padding: '11px 20px',
              fontSize: 15,
              fontWeight: 600,
              cursor: valid ? 'pointer' : 'default',
            }}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
