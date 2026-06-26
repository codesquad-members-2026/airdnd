import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HostHeader } from '../../components/HostHeader';
import { Icon } from '../../shared/Icon';
import { ConfirmDeleteWishlistModal } from '../../components/ConfirmDeleteWishlistModal';
import { deleteWishlist, ApiError } from '../../shared/api/wishlist';
import type { WishlistSummary } from '../../types';

export function WishlistPage() {
  const navigate = useNavigate();
  const onLogo = () => navigate('/');
  const onHosting = () => navigate('/host');
  const onOpenWishlist = (wishlistId: number) => navigate(`/wishlists/${wishlistId}`);
  const [wishlists, setWishlists] = useState<WishlistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  // 삭제 확인 모달: 대상 위시리스트 + 제출/에러 상태
  const [target, setTarget] = useState<WishlistSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/wishlists')
      .then(res => res.json())
      .then(json => setWishlists(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 확인 모달의 "삭제": DELETE /api/wishlists/{wishlistId} → 성공 시 목록에서 제거
  const confirmDelete = () => {
    if (!target) return;
    const id = target.id;
    setDeleting(true);
    setDeleteError(null);
    deleteWishlist(id)
      .then(() => {
        setWishlists(prev => prev.filter(w => w.id !== id));
        setTarget(null);
      })
      .catch(e => setDeleteError(e instanceof ApiError ? e.message : '삭제에 실패했어요'))
      .finally(() => setDeleting(false));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <HostHeader
        onLogo={onLogo}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onHosting}
              style={{
                background: 'none', border: 'none',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                color: 'var(--ink-1)', cursor: 'pointer', padding: '0 8px',
              }}
            >
              호스팅 하기
            </button>
            <button
              onClick={onLogo}
              style={{
                height: 40, padding: '0 18px', borderRadius: 10,
                border: '1px solid var(--line-strong)', background: '#fff',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                color: 'var(--ink-2)', cursor: 'pointer',
              }}
            >
              홈으로
            </button>
          </div>
        }
      />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 40px 100px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700,
          color: 'var(--ink-1)', marginBottom: 32,
        }}>
          위시리스트
        </h1>

        {loading ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 15 }}>불러오는 중...</div>
        ) : wishlists.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 28,
          }}>
            {wishlists.map(w => (
              <WishlistCard
                key={w.id}
                wishlist={w}
                deleting={deleting && target?.id === w.id}
                onClick={() => onOpenWishlist?.(w.id)}
                onDelete={() => {
                  setDeleteError(null);
                  setTarget(w);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmDeleteWishlistModal
        open={target != null}
        name={target?.name ?? ''}
        deleting={deleting}
        error={deleteError}
        onClose={() => setTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function WishlistCard({
  wishlist, deleting, onClick, onDelete,
}: {
  wishlist: WishlistSummary;
  deleting: boolean;
  onClick?: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', opacity: deleting ? 0.5 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'relative',
        width: '100%', aspectRatio: '1 / 1',
        borderRadius: 16, overflow: 'hidden',
        background: 'var(--surface-alt-2)',
      }}>
        {wishlist.imgUrl ? (
          <img
            src={wishlist.imgUrl}
            alt={wishlist.name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 220ms ease',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="image" size={44} color="var(--ink-4)" />
          </div>
        )}

        <button
          aria-label="위시리스트 삭제"
          disabled={deleting}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'rgba(255,255,255,0.92)',
            boxShadow: 'var(--shadow-md)',
            cursor: deleting ? 'default' : 'pointer',
          }}
        >
          <Icon name="x" size={18} color="var(--ink-1)" />
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-1)' }}>
          {wishlist.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
          저장된 항목 {wishlist.itemCount}개
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', paddingTop: 100 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--surface-alt-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <Icon name="heart" size={32} color="var(--ink-3)" />
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 8 }}>
        저장된 위시리스트가 없어요
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>
        마음에 드는 숙소를 위시리스트에 추가해보세요.
      </div>
    </div>
  );
}
