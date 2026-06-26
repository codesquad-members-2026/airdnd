import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type ToastVariant = 'success' | 'info' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DURATION = 2600; // 자동 사라짐(ms)
const EXIT_MS = 220; // 퇴장 애니메이션(ms)

let seq = 0;

/**
 * 화면 상단 중앙에 잠깐 떴다 사라지는 알림(토스트) 제공자.
 * 로그인/로그아웃 등 사용자 액션 결과를 가볍게 안내한다. (외부 라이브러리 없이 구현)
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant = 'info') => {
    setToasts((prev) => [...prev, { id: ++seq, message, variant }]);
  }, []);

  const success = useCallback((m: string) => show(m, 'success'), [show]);
  const error = useCallback((m: string) => show(m, 'error'), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000, // 모달(zIndex 200)보다 위
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ACCENT: Record<ToastVariant, string> = {
  success: '#1F9D6B',
  info: 'var(--ink-1)',
  error: 'var(--brand-coral)',
};

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [leaving, setLeaving] = useState(false);

  // 일정 시간 뒤 퇴장 시작
  useEffect(() => {
    const t = window.setTimeout(() => setLeaving(true), DURATION);
    return () => window.clearTimeout(t);
  }, []);

  // 퇴장 애니메이션 끝나면 제거
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(onClose, EXIT_MS);
    return () => window.clearTimeout(t);
  }, [leaving, onClose]);

  return (
    <div
      role="status"
      onClick={() => setLeaving(true)} // 클릭하면 즉시 닫기
      style={{
        pointerEvents: 'auto',
        cursor: 'pointer',
        minWidth: 240,
        maxWidth: 380,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 16px',
        background: 'var(--surface)',
        borderRadius: 14,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.16)',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink-1)',
        animation: `${leaving ? 'toast-out' : 'toast-in'} ${leaving ? EXIT_MS : 260}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
      }}
    >
      <span
        style={{
          flex: '0 0 auto',
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: ACCENT[toast.variant],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ToastGlyph variant={toast.variant} />
      </span>
      <span>{toast.message}</span>
    </div>
  );
}

function ToastGlyph({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (variant === 'error') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" aria-hidden>
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    );
  }
  // info: 세로 "i"
  return (
    <svg width="4" height="14" viewBox="0 0 4 16" aria-hidden>
      <rect width="4" height="4" rx="2" fill="#fff" />
      <rect y="6" width="4" height="10" rx="2" fill="#fff" />
    </svg>
  );
}
