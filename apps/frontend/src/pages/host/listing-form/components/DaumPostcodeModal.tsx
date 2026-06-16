import { useEffect, useRef } from 'react';

interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  sido: string;
  sigungu: string;
}

interface DaumPostcodeModalProps {
  onComplete: (data: DaumPostcodeData) => void;
  onClose: () => void;
}

export function DaumPostcodeModal({ onComplete, onClose }: DaumPostcodeModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    new window.kakao.Postcode({
      oncomplete(data: DaumPostcodeData) {
        onCompleteRef.current(data);
        setTimeout(() => onCloseRef.current(), 0);
      },
    }).embed(container);

    // StrictMode 이중 실행 시 기존 iframe 제거
    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="주소 검색"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 16 }}>주소 검색</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
              fontSize: 20,
              color: 'var(--ink-2)',
            }}
          >
            ✕
          </button>
        </div>
        <div ref={containerRef} style={{ height: 460 }} />
      </div>
    </div>
  );
}
