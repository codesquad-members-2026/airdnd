import { useState, useEffect } from 'react';
import { Icon } from '../../shared/Icon';

// 각 사진 셀 안쪽 경계 음영(분할선 포함)
const CELL_SHADOW = 'inset 0 0 0 1px rgba(0,0,0,0.06), inset 0 0 10px rgba(0,0,0,0.10)';

interface DetailGalleryProps {
  title: string;
  images: string[]; // 전체 이미지(바깥엔 앞 5개만, 모달엔 전부)
  saved?: boolean;
  onToggleSave?: () => void;
}

// 레퍼런스 상단: 제목 + 공유/저장 + 5분할 사진 그리드
export function DetailGallery({ title, images, saved, onToggleSave }: DetailGalleryProps) {
  const [main, ...rest] = images;
  // null이면 닫힘, 숫자면 그 인덱스 사진으로 열기
  const [openAt, setOpenAt] = useState<number | null>(null);
  return (
    <div style={{ marginBottom: 40 }}>
      {/* 제목 + 액션 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26 }}>{title}</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <GalleryAction icon="arrow-up-down" label="공유하기" />
          <GalleryAction
            icon="heart"
            label={saved ? '저장됨' : '저장'}
            active={saved}
            onClick={onToggleSave}
          />
        </div>
      </div>

      {/* 사진 그리드 */}
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
          height: 440,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 14px rgba(0,0,0,0.16)',
        }}
      >
        <div
          onClick={() => setOpenAt(0)}
          style={{ gridRow: '1 / span 2', background: `url(${main}) center/cover`, boxShadow: CELL_SHADOW, cursor: 'pointer' }}
        />
        {rest.slice(0, 4).map((src, i) => (
          <div
            key={i}
            onClick={() => setOpenAt(i + 1)}
            style={{ background: `url(${src}) center/cover`, boxShadow: CELL_SHADOW, cursor: 'pointer' }}
          />
        ))}

        <button
          onClick={() => setOpenAt(0)}
          style={{
            position: 'absolute',
            right: 18,
            bottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 40,
            padding: '0 16px',
            borderRadius: 10,
            border: '1px solid var(--line-strong)',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--ink-1)',
            transition: 'transform 120ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Icon name="grip" size={16} />
          사진 모두 보기
        </button>
      </div>

      {openAt != null && (
        <AllPhotosModal images={images} startIndex={openAt} onClose={() => setOpenAt(null)} />
      )}
    </div>
  );
}

function AllPhotosModal({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const scrollTo = (i: number, behavior: ScrollBehavior = 'smooth') =>
    document.getElementById(`apm-photo-${i}`)?.scrollIntoView({ behavior, block: 'start' });

  // 열릴 때 클릭한 사진으로 즉시 점프
  useEffect(() => {
    if (startIndex > 0) scrollTo(startIndex, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 브라우저 뒤로가기 시 페이지 이동 대신 모달만 닫기
  useEffect(() => {
    window.history.pushState({ photoModal: true }, '');
    const onPop = () => onClose();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#fff',
        overflowY: 'auto',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          display: 'flex',
          alignItems: 'center',
          height: 64,
          padding: '0 48px',
          background: '#fff',
          zIndex: 2,
        }}
      >
        <button
          onClick={() => window.history.back()}
          aria-label="닫기"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 8, display: 'flex' }}
        >
          <Icon name="chevron-left" size={22} />
        </button>
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '8px 48px 80px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, marginBottom: 24 }}>사진 투어</h2>

        {/* 썸네일 행 — 클릭 시 해당 사진으로 스크롤 */}
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, marginBottom: 40 }}>
          {images.map((src, i) => (
            <div key={i} style={{ flex: '0 0 auto', cursor: 'pointer' }} onClick={() => scrollTo(i)}>
              <div
                style={{
                  width: 150,
                  height: 110,
                  borderRadius: 10,
                  background: `url(${src}) center/cover`,
                  boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
                }}
              />
              <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8 }}>사진 {i + 1}</div>
            </div>
          ))}
        </div>

        {/* 각 사진 섹션 */}
        {images.map((src, i) => (
          <div key={i} id={`apm-photo-${i}`} style={{ marginBottom: 32, scrollMarginTop: 80 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>사진 {i + 1}</div>
            <img
              src={src}
              alt=""
              style={{ width: '100%', borderRadius: 12, display: 'block', background: 'var(--surface-alt-2)' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryAction({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 36,
        padding: '0 10px',
        border: 'none',
        background: 'transparent',
        borderRadius: 8,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink-1)',
        textDecoration: 'underline',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon
        name={icon}
        size={15}
        fill={active ? 'var(--brand-coral)' : 'none'}
        color={active ? 'var(--brand-coral)' : 'var(--ink-1)'}
      />
      {label}
    </button>
  );
}
