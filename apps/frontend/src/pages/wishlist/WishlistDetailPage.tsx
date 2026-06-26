import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HostHeader } from '../../components/HostHeader';
import { EditNoteModal } from '../../components/EditNoteModal';
import { RenameWishlistModal } from '../../components/RenameWishlistModal';
import { WishlistSettingsMenu } from '../../components/WishlistSettingsMenu';
import { ConfirmDeleteWishlistModal } from '../../components/ConfirmDeleteWishlistModal';
import { Icon } from '../../shared/Icon';
import {
  updateWishlistItemNote,
  renameWishlist,
  deleteWishlist,
  removeWishlistItem,
  ApiError,
} from '../../shared/api/wishlist';
import { API_BASE } from '../../shared/api/config';
import { refreshingFetch } from '../../shared/api/http';
import type { WishlistDetail, WishlistDetailItem } from '../../types';

export function WishlistDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const wishlistId = Number(id);
  const onBack = () => navigate('/wishlists');
  const onLogo = () => navigate('/');
  const onHosting = () => navigate('/host');
  const [detail, setDetail] = useState<WishlistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 메모 수정 모달: 대상 항목 + 제출/에러 상태
  const [editing, setEditing] = useState<WishlistDetailItem | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // 하트 클릭으로 제거 중인 항목 listingId (중복 클릭 방지)
  const [removingId, setRemovingId] = useState<number | null>(null);

  // 환경설정("...") 메뉴 + 이름 변경 / 삭제
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    refreshingFetch(`${API_BASE}/api/wishlists/${wishlistId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(json => setDetail(json.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [wishlistId]);

  const items = detail?.items ?? [];

  const openNote = (item: WishlistDetailItem) => {
    setNoteError(null);
    setEditing(item);
  };

  // 하트 클릭: DELETE /api/wishlists/{wishlistId}/items/{listingId} → 목록에서 제거
  const removeItem = (listingId: number) => {
    if (removingId != null) return;
    setRemovingId(listingId);
    removeWishlistItem(wishlistId, listingId)
      .then(() => {
        setDetail(prev =>
          prev ? { ...prev, items: prev.items.filter(it => it.listingId !== listingId) } : prev,
        );
      })
      .catch(() => {})
      .finally(() => setRemovingId(null));
  };

  const saveNote = (note: string) => {
    if (!editing) return;
    setSavingNote(true);
    setNoteError(null);
    updateWishlistItemNote(wishlistId, editing.listingId, note)
      .then(result => {
        // 로컬 상태만 갱신 — 전체 재요청 없이 해당 항목의 메모를 교체
        setDetail(prev =>
          prev
            ? {
                ...prev,
                items: prev.items.map(it =>
                  it.listingId === editing.listingId ? { ...it, note: result.note } : it,
                ),
              }
            : prev,
        );
        setEditing(null);
      })
      .catch(e =>
        setNoteError(e instanceof ApiError ? e.message : '메모 저장에 실패했어요'),
      )
      .finally(() => setSavingNote(false));
  };

  // 이름 변경: PATCH /api/wishlists/{wishlistId}
  const saveName = (name: string) => {
    setSavingName(true);
    setNameError(null);
    renameWishlist(wishlistId, name)
      .then(result => {
        setDetail(prev => (prev ? { ...prev, name: result.name } : prev));
        setRenaming(false);
      })
      .catch(e =>
        setNameError(e instanceof ApiError ? e.message : '이름 변경에 실패했어요'),
      )
      .finally(() => setSavingName(false));
  };

  // 삭제: DELETE /api/wishlists/{wishlistId} → 목록으로 복귀
  const removeWishlist = () => {
    setDeleting(true);
    setDeleteError(null);
    deleteWishlist(wishlistId)
      .then(() => onBack())
      .catch(e => {
        setDeleteError(e instanceof ApiError ? e.message : '삭제에 실패했어요');
        setDeleting(false);
      });
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

      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 40px 100px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 4,
        }}>
          <button
            onClick={onBack}
            aria-label="뒤로"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: '50%',
              border: 'none', background: 'none', cursor: 'pointer',
              marginLeft: -8,
            }}
          >
            <Icon name="chevron-left" size={24} color="var(--ink-1)" />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="환경설정"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: '50%',
                border: 'none', background: 'none', cursor: 'pointer',
                marginRight: -8,
              }}
            >
              <Icon name="more-horizontal" size={24} color="var(--ink-1)" />
            </button>

            <WishlistSettingsMenu
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              onRename={() => {
                setMenuOpen(false);
                setNameError(null);
                setRenaming(true);
              }}
              onDelete={() => {
                setMenuOpen(false);
                setDeleteError(null);
                setConfirmDelete(true);
              }}
            />
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
          color: 'var(--ink-1)', margin: '0 0 20px',
        }}>
          {detail?.name ?? ' '}
        </h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          <PillButton>날짜 입력하기</PillButton>
          <PillButton>게스트 {items.length}명</PillButton>
          <PillButton>공유하기</PillButton>
        </div>

        {loading ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 15 }}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 28,
          }}>
            {items.map(item => (
              <ListingCard
                key={item.listingId}
                item={item}
                removing={removingId === item.listingId}
                onOpen={() => navigate(`/listings/${item.listingId}`)}
                onEditNote={() => openNote(item)}
                onRemove={() => removeItem(item.listingId)}
              />
            ))}
          </div>
        )}
      </main>

      <EditNoteModal
        open={editing != null}
        listingName={editing?.listingName ?? ''}
        initialNote={editing?.note ?? ''}
        submitting={savingNote}
        error={noteError}
        onClose={() => setEditing(null)}
        onSave={saveNote}
      />

      <RenameWishlistModal
        open={renaming}
        initialName={detail?.name ?? ''}
        submitting={savingName}
        error={nameError}
        onClose={() => setRenaming(false)}
        onSave={saveName}
      />

      <ConfirmDeleteWishlistModal
        open={confirmDelete}
        name={detail?.name ?? ''}
        deleting={deleting}
        error={deleteError}
        onClose={() => setConfirmDelete(false)}
        onConfirm={removeWishlist}
      />
    </div>
  );
}

function PillButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        height: 38, padding: '0 16px', borderRadius: 999,
        border: '1px solid var(--line-strong)', background: '#fff',
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
        color: 'var(--ink-2)', cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function ListingCard({
  item, removing, onOpen, onEditNote, onRemove,
}: {
  item: WishlistDetailItem;
  removing: boolean;
  onOpen: () => void;
  onEditNote: () => void;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const cover = item.imageUrls?.[0];

  return (
    <div>
      <div
        style={{ position: 'relative', cursor: 'pointer' }}
        onClick={onOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          width: '100%', aspectRatio: '1 / 1',
          borderRadius: 16, overflow: 'hidden',
          background: 'var(--surface-alt-2)',
        }}>
          {cover ? (
            <img
              src={cover}
              alt={item.listingName}
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
            }} />
          )}
        </div>

        <button
          aria-label="위시리스트에서 제거"
          disabled={removing}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 30, height: 30, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'none', padding: 0,
            cursor: removing ? 'default' : 'pointer',
            opacity: removing ? 0.5 : 1,
          }}
        >
          <Icon name="heart" size={26} color="#fff" fill="var(--brand-coral)" strokeWidth={1.6} />
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <div
          onClick={onOpen}
          style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-1)', cursor: 'pointer' }}
        >
          {item.listingName}
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 4 }}>
          ₩{item.pricePerNight.toLocaleString()} <span style={{ color: 'var(--ink-3)' }}>/박</span>
        </div>

        <button
          onClick={onEditNote}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            marginTop: 12, padding: '10px 14px',
            borderRadius: 12, border: '1px solid var(--line)',
            background: '#fff', fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: item.note ? 'var(--ink-1)' : 'var(--ink-3)',
            cursor: 'pointer',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}
        >
          {item.note ? item.note : '메모 추가'}
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--surface-alt-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <Icon name="heart" size={32} color="var(--ink-3)" />
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 8 }}>
        저장된 숙소가 없어요
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>
        마음에 드는 숙소를 이 위시리스트에 추가해보세요.
      </div>
    </div>
  );
}
