import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Heart } from 'lucide-react';
import { useCurrentUserQuery } from '../../auth/api/authQueries';
import {
  useAddRoomToWishlistMutation,
  useRemoveRoomFromWishlistFolderMutation,
  useRoomWishlistIdsQuery,
  useSavedRoomIdsQuery,
  useWishlistsQuery,
} from '../api/wishlistQueries';

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

  // 팝오버가 열려 있고 로그인된 경우에만 폴더 목록/멤버십을 불러옵니다(카드마다 미리 호출하지 않도록).
  const wishlistsQuery = useWishlistsQuery(isOpen && Boolean(user));
  const roomFoldersQuery = useRoomWishlistIdsQuery(roomId, isOpen && Boolean(user));
  // 저장 여부(빨간 하트) 표시용. 같은 쿼리 키를 공유하므로 카드가 많아도 요청은 1번만 나갑니다.
  const savedRoomIdsQuery = useSavedRoomIdsQuery(Boolean(user));
  const isSaved = savedRoomIdsQuery.data?.includes(roomId) ?? false;

  const addMutation = useAddRoomToWishlistMutation();
  const removeFolderMutation = useRemoveRoomFromWishlistFolderMutation();

  function handleTriggerClick(event: React.MouseEvent) {
    // 카드 전체를 감싼 <Link>로 이벤트가 전파되어 상세로 이동하는 것을 막습니다.
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    // 저장 여부와 무관하게 폴더 토글 팝오버를 엽니다(여러 폴더에 담거나 폴더별로 뺄 수 있음).
    setIsOpen((open) => !open);
  }

  // 폴더 줄 클릭: 담겨 있으면 그 폴더에서 빼고, 아니면 그 폴더에 담습니다(폴더별 토글).
  function handleToggleFolder(wishlistId: number, inFolder: boolean) {
    if (inFolder) {
      removeFolderMutation.mutate({ wishlistId, roomId });
    } else {
      addMutation.mutate({ wishlistId, roomId });
    }
  }

  const wishlists = wishlistsQuery.data;
  const folderIds = roomFoldersQuery.data;
  const isMembershipLoading = wishlistsQuery.isLoading || roomFoldersQuery.isLoading;
  const hasError = wishlistsQuery.error || roomFoldersQuery.error;
  const mutationError = addMutation.error || removeFolderMutation.error;

  return (
    <div className={`wishlist-pop ${className ?? ''}`}>
      <button
        type="button"
        className={`${variant === 'text' ? 'wishlist-save-text' : 'icon-button wishlist-save-icon'}${
          isSaved ? ' is-saved' : ''
        }`}
        aria-label={isSaved ? '위시리스트 편집' : '위시리스트에 저장'}
        aria-pressed={isSaved}
        aria-expanded={isOpen}
        onClick={handleTriggerClick}
      >
        <Heart size={variant === 'text' ? 16 : 18} />
        {variant === 'text' ? <span>{isSaved ? '저장됨' : '저장'}</span> : null}
      </button>

      {isOpen ? (
        <>
          <div className="wishlist-pop-backdrop" onClick={() => setIsOpen(false)} />
          <div className="wishlist-pop-panel" role="dialog" aria-label="위시리스트 선택">
            <p className="wishlist-pop-title">위시리스트에 저장</p>

            {isMembershipLoading ? <p className="wishlist-pop-status">불러오는 중…</p> : null}
            {hasError ? <p className="wishlist-pop-status">목록을 불러오지 못했습니다.</p> : null}
            {mutationError ? (
              <p className="wishlist-pop-status">변경에 실패했습니다. 다시 시도해 주세요.</p>
            ) : null}

            {wishlists && wishlists.length === 0 ? (
              <p className="wishlist-pop-status">아직 위시리스트가 없습니다.</p>
            ) : null}

            {wishlists && wishlists.length > 0 && folderIds ? (
              <ul className="wishlist-pop-list">
                {wishlists.map((wishlist) => {
                  const inFolder = folderIds.includes(wishlist.id);
                  return (
                    <li key={wishlist.id}>
                      <button
                        type="button"
                        className={inFolder ? 'is-in-folder' : ''}
                        aria-pressed={inFolder}
                        onClick={() => handleToggleFolder(wishlist.id, inFolder)}
                      >
                        {inFolder ? <Check size={16} /> : <Heart size={14} />}
                        <span className="pop-name">{wishlist.name}</span>
                        <small className="pop-count">{inFolder ? '담김' : wishlist.roomCount}</small>
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
