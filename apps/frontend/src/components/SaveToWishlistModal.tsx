import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../shared/Icon';
import {
  getWishlists,
  addItemToWishlist,
  createWishlistWithItem,
  ApiError,
} from '../shared/api/wishlist';
import type { WishlistSummary } from '../types';

const MAX_NAME = 50;

interface SaveToWishlistModalProps {
  open: boolean;
  /** 저장할 리스팅 id (열려 있을 땐 non-null) */
  listingId: number | null;
  onClose: () => void;
  /** 저장 성공 시: 위시리스트 이름·id를 넘겨 부모가 하트 채움 + 토스트 + unlike 대상 추적 */
  onSaved: (wishlistName: string, wishlistId: number) => void;
}

/**
 * 리스팅 하트 클릭 시 뜨는 "위시리스트에 저장" 모달.
 * 2단계(step) 전환: list(기존 선택) ↔ create(새로 만들기).
 * 위시리스트가 0개면 list를 건너뛰고 바로 create로 진입.
 * GET/POST 를 직접 소유한다 — 부모는 listingId 만 주고 onSaved 만 받는다.
 */
export function SaveToWishlistModal({ open, listingId, onClose, onSaved }: SaveToWishlistModalProps) {
  const [step, setStep] = useState<'list' | 'create'>('list');
  const [name, setName] = useState('');
  const [wishlists, setWishlists] = useState<WishlistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 열릴 때마다 목록을 새로 불러온다. 0개면 곧장 생성 단계.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setStep('list');
    setName('');
    setError(null);
    setLoading(true);
    getWishlists()
      .then((ws) => {
        if (!alive) return;
        setWishlists(ws);
        if (ws.length === 0) setStep('create');
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : '목록을 불러오지 못했어요'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open]);

  // ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const hasLists = wishlists.length > 0;

  // 생성 단계 뒤로가기: 목록 있으면 목록으로, 빈 상태 직진이면 닫기
  const goBack = () => (hasLists ? (setError(null), setStep('list')) : onClose());

  // 공통 실패 처리 (409 = 이미 저장됨)
  const handleError = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 409) {
      setError('이미 위시리스트에 저장된 숙소예요.');
    } else {
      setError(e instanceof Error ? e.message : '저장에 실패했어요');
    }
  }, []);

  const selectExisting = (w: WishlistSummary) => {
    if (listingId == null || submitting) return;
    setSubmitting(true);
    setError(null);
    addItemToWishlist(w.id, listingId)
      .then(() => onSaved(w.name, w.id))
      .catch(handleError)
      .finally(() => setSubmitting(false));
  };

  const create = () => {
    const trimmed = name.trim();
    if (listingId == null || !trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    createWishlistWithItem(listingId, trimmed)
      .then((res) => onSaved(trimmed, res.wishlistId))
      .catch(handleError)
      .finally(() => setSubmitting(false));
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="위시리스트에 저장하기"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: 540,
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-pop)',
        }}
      >
        {step === 'list' ? (
          <ListStep
            wishlists={wishlists}
            loading={loading}
            submitting={submitting}
            error={error}
            onClose={onClose}
            onSelect={selectExisting}
            onNew={() => (setError(null), setStep('create'))}
          />
        ) : (
          <CreateStep
            name={name}
            submitting={submitting}
            error={error}
            onName={setName}
            onBack={goBack}
            onCancel={onClose}
            onCreate={create}
          />
        )}
      </div>
    </div>
  );
}

/* ── 1단계: 위시리스트 목록 선택 ───────────────────────────── */

interface ListStepProps {
  wishlists: WishlistSummary[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSelect: (w: WishlistSummary) => void;
  onNew: () => void;
}

function ListStep({ wishlists, loading, submitting, error, onClose, onSelect, onNew }: ListStepProps) {
  return (
    <>
      <header style={headerStyle}>
        <span style={titleStyle}>위시리스트에 저장하기</span>
        <button aria-label="닫기" onClick={onClose} style={{ ...iconBtnStyle, right: 14 }}>
          <Icon name="x" size={20} />
        </button>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
          alignContent: 'start',
        }}
      >
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--ink-3)', padding: '40px 0' }}>
            불러오는 중...
          </div>
        ) : (
          wishlists.map((w) => (
            <WishlistGridCard key={w.id} wishlist={w} disabled={submitting} onClick={() => onSelect(w)} />
          ))
        )}
      </div>

      <footer style={{ ...footerStyle, display: 'block' }}>
        {error && <div style={errorTextStyle}>{error}</div>}
        <button onClick={onNew} disabled={submitting} style={primaryBtnStyle(!submitting, '100%')}>
          새로운 위시리스트 만들기
        </button>
      </footer>
    </>
  );
}

function WishlistGridCard({
  wishlist,
  disabled,
  onClick,
}: {
  wishlist: WishlistSummary;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--ink-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {wishlist.imgUrl ? (
          <img
            src={wishlist.imgUrl}
            alt={wishlist.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 220ms ease',
            }}
          />
        ) : (
          <Icon name="heart" size={56} color="#fff" strokeWidth={1.5} />
        )}
      </div>
      <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: 'var(--ink-1)' }}>
        {wishlist.name}
      </div>
      <div style={{ marginTop: 2, fontSize: 13, color: 'var(--ink-3)' }}>
        저장된 항목 {wishlist.itemCount}개
      </div>
    </div>
  );
}

/* ── 2단계: 새 위시리스트 이름 입력 ─────────────────────────── */

interface CreateStepProps {
  name: string;
  submitting: boolean;
  error: string | null;
  onName: (v: string) => void;
  onBack: () => void;
  onCancel: () => void;
  onCreate: () => void;
}

function CreateStep({ name, submitting, error, onName, onBack, onCancel, onCreate }: CreateStepProps) {
  const [focused, setFocused] = useState(false);
  const canCreate = name.trim().length > 0 && !submitting;

  return (
    <>
      <header style={headerStyle}>
        <button aria-label="뒤로" onClick={onBack} style={{ ...iconBtnStyle, left: 14 }}>
          <Icon name="arrow-left" size={20} />
        </button>
        <span style={titleStyle}>위시리스트 만들기</span>
      </header>

      <div style={{ padding: '24px 20px' }}>
        <input
          autoFocus
          value={name}
          maxLength={MAX_NAME}
          placeholder="이름"
          onChange={(e) => onName(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canCreate) onCreate();
          }}
          style={{
            width: '100%',
            height: 56,
            padding: '0 16px',
            boxSizing: 'border-box',
            borderRadius: 12,
            border: `1px solid ${focused ? 'var(--ink-1)' : 'var(--line-strong)'}`,
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            color: 'var(--ink-1)',
          }}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-3)' }}>
          {name.length}/{MAX_NAME}자
        </div>
        {error && <div style={{ ...errorTextStyle, marginTop: 12, marginBottom: 0 }}>{error}</div>}
      </div>

      <footer style={{ ...footerStyle, justifyContent: 'space-between' }}>
        <button onClick={onCancel} style={textBtnStyle}>
          취소
        </button>
        <button disabled={!canCreate} onClick={onCreate} style={primaryBtnStyle(canCreate, undefined)}>
          {submitting ? '저장 중...' : '새로 만들기'}
        </button>
      </footer>
    </>
  );
}

/* ── 공통 스타일 ───────────────────────────────────────────── */

const headerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '18px 20px',
  borderBottom: '1px solid var(--line-soft)',
  flex: 'none',
} as const;

const titleStyle = { fontSize: 16, fontWeight: 700, color: 'var(--ink-1)' } as const;

const iconBtnStyle = {
  position: 'absolute',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 6,
  display: 'flex',
  color: 'var(--ink-1)',
} as const;

const footerStyle = {
  padding: '14px 20px',
  borderTop: '1px solid var(--line-soft)',
  display: 'flex',
  alignItems: 'center',
  flex: 'none',
} as const;

const errorTextStyle = {
  fontSize: 13,
  color: 'var(--brand-coral)',
  marginBottom: 10,
} as const;

const textBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--ink-1)',
  textDecoration: 'underline',
  padding: 6,
} as const;

function primaryBtnStyle(enabled: boolean, width: string | undefined) {
  return {
    width,
    height: width ? 52 : 46,
    padding: width ? undefined : '0 22px',
    border: 'none',
    borderRadius: width ? 10 : 8,
    background: enabled ? 'var(--cta-dark)' : 'var(--surface-alt-2)',
    color: enabled ? '#fff' : 'var(--ink-4)',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    fontWeight: 700,
    cursor: enabled ? 'pointer' : 'default',
  } as const;
}
