import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Heart } from 'lucide-react';
import { useCurrentUserQuery } from '../../auth/api/authQueries';
import { useAddRoomToWishlistMutation, useWishlistsQuery } from '../api/wishlistQueries';
import { ApiError } from '../../../shared/api/apiError';

interface AddToWishlistButtonProps {
  roomId: number;
  variant?: 'icon' | 'text';
  className?: string;
}

export function AddToWishlistButton({
  roomId,
  variant = 'icon',
  className,
}: AddToWishlistButtonProps) {
  const { data: user } = useCurrentUserQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [savedWishlistIds, setSavedWishlistIds] = useState<Set<number>>(new Set());

  // 팝오버가 열려 있고 로그인된 경우에만 위시리스트 목록을 불러옵니다(목록 페이지에서 카드마다 미리 호출하지 않도록).
  const wishlistsQuery = useWishlistsQuery(isOpen && Boolean(user));
  const addMutation = useAddRoomToWishlistMutation();

  function markSaved(wishlistId: number) {
    setSavedWishlistIds((prev) => new Set(prev).add(wishlistId));
  }

  function handleTriggerClick(event: React.MouseEvent) {
    // 카드 전체를 감싼 <Link>로 이벤트가 전파되어 상세로 이동하는 것을 막습니다.
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setSavedWishlistIds(new Set());
    setIsOpen((open) => !open);
  }

  function handleSelect(wishlistId: number) {
    addMutation.mutate(
      { wishlistId, roomId },
      {
        onSuccess: () => markSaved(wishlistId),
        onError: (error) => {
          // 이미 담긴 숙소(409)는 실패가 아니라 "이미 저장됨"으로 처리합니다.
          if (error instanceof ApiError && error.status === 409) {
            markSaved(wishlistId);
          }
        },
      },
    );
  }

  const wishlists = wishlistsQuery.data;
  const addError = addMutation.error;
  // 409(중복)는 위에서 담김으로 처리하므로 일반 실패 메시지에서는 제외합니다.
  const showAddError =
    addError instanceof ApiError ? addError.status !== 409 : Boolean(addError);

  return (
    <div className={`wishlist-pop ${className ?? ''}`}>
      <button
        type="button"
        className={variant === 'text' ? 'wishlist-save-text' : 'icon-button wishlist-save-icon'}
        aria-label="위시리스트에 저장"
        aria-expanded={isOpen}
        onClick={handleTriggerClick}
      >
        <Heart size={variant === 'text' ? 16 : 18} />
        {variant === 'text' ? <span>저장</span> : null}
      </button>

      {isOpen ? (
        <>
          <div className="wishlist-pop-backdrop" onClick={() => setIsOpen(false)} />
          <div className="wishlist-pop-panel" role="dialog" aria-label="위시리스트 선택">
            <p className="wishlist-pop-title">위시리스트에 저장</p>

            {wishlistsQuery.isLoading ? (
              <p className="wishlist-pop-status">불러오는 중…</p>
            ) : null}
            {wishlistsQuery.error ? (
              <p className="wishlist-pop-status">목록을 불러오지 못했습니다.</p>
            ) : null}
            {showAddError ? (
              <p className="wishlist-pop-status">저장에 실패했습니다. 다시 시도해 주세요.</p>
            ) : null}

            {wishlists && wishlists.length === 0 ? (
              <p className="wishlist-pop-status">아직 위시리스트가 없습니다.</p>
            ) : null}

            {wishlists && wishlists.length > 0 ? (
              <ul className="wishlist-pop-list">
                {wishlists.map((wishlist) => {
                  const isSaved = savedWishlistIds.has(wishlist.id);
                  return (
                    <li key={wishlist.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(wishlist.id)}
                        disabled={addMutation.isPending || isSaved}
                      >
                        {isSaved ? <Check size={16} /> : <Heart size={14} />}
                        <span className="pop-name">{wishlist.name}</span>
                        <small className="pop-count">{isSaved ? '담김' : wishlist.roomCount}</small>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
