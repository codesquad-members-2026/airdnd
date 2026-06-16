import { useState } from 'react';
import { Icon } from '../../../../shared/Icon';
import { ImageUploadModal } from '../components/ImageUploadModal';

export function ImagesStep({
  images,
  onChange,
  error,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  const drop = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const next = [...images];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(overIndex, 0, moved);
      onChange(next);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26 }}>
          사진을 5장 이상 추가하세요
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          aria-label="사진 추가"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid var(--line-strong)',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="plus" size={18} />
        </button>
      </div>
      <p style={{ fontSize: 14, color: error ? 'var(--brand-coral)' : 'var(--ink-3)', marginBottom: 20 }}>
        {error ?? `드래그하여 순서를 변경할 수 있어요. 현재 ${images.length}장.`}
      </p>

      {images.length === 0 ? (
        <button
          onClick={() => setModalOpen(true)}
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: 14,
            border: '2px dashed var(--line-strong)',
            background: 'var(--surface-alt-2)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: 'var(--ink-3)',
          }}
        >
          <Icon name="plus" size={28} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>사진 추가</span>
        </button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {images.map((url, i) => (
            <PhotoCard
              key={i}
              url={url}
              isCover={i === 0}
              dragging={dragIndex === i}
              over={overIndex === i && dragIndex !== i}
              onRemove={() => remove(i)}
              onDragStart={() => setDragIndex(i)}
              onDragEnter={() => setOverIndex(i)}
              onDrop={drop}
              onDragEnd={drop}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <ImageUploadModal
          onAdd={url => onChange([...images, url])}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function PhotoCard({
  url,
  isCover,
  dragging,
  over,
  onRemove,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
}: {
  url: string;
  isCover: boolean;
  dragging: boolean;
  over: boolean;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        gridColumn: isCover ? '1 / -1' : 'auto',
        position: 'relative',
        aspectRatio: isCover ? '16 / 9' : '4 / 3',
        borderRadius: 14,
        overflow: 'hidden',
        background: 'var(--surface-alt-2)',
        cursor: 'grab',
        opacity: dragging ? 0.4 : 1,
        outline: over ? '3px solid var(--ink-1)' : 'none',
        outlineOffset: -3,
        transition: 'opacity 120ms ease',
      }}
    >
      <img
        src={url}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {isCover && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'var(--ink-1)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 6,
          }}
        >
          커버 사진
        </span>
      )}

      <button
        onClick={onRemove}
        aria-label="사진 삭제"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="x" size={15} />
      </button>
    </div>
  );
}
