import { useState } from 'react';
import { removeWishlistItem, fetchListingWishlistId } from '../../shared/api/wishlist';
import { useAppState } from '../../shared/AppState';
import type { ListingCardResponse } from '../../shared/api/generated/types.gen';

// 메인 지역 행들이 공유하는 찜 상태 — Results의 찜 로직을 재사용.
// 값=찜됨(DELETE 대상 wishlistId), null=이번 세션에 해제, 키 없음=서버값 사용
export function useHomeWishlist() {
  const { isLoggedIn, openLogin } = useAppState();
  const [wishlistOverride, setWishlistOverride] = useState<Record<number, number | null>>({});
  const [saveFor, setSaveFor] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const wishlistIdOf = (c: ListingCardResponse): number | null => {
    if (c.id != null && wishlistOverride[c.id] !== undefined) return wishlistOverride[c.id];
    return c.wishlistId ?? null;
  };
  const isLiked = (c: ListingCardResponse) => wishlistIdOf(c) != null;

  const onHeart = (c: ListingCardResponse) => {
    const listingId = c.id;
    if (listingId == null) return;
    if (!isLoggedIn) {
      openLogin(
        '위시리스트에 저장하려면 로그인이 필요해요.',
        () => {
          fetchListingWishlistId(listingId)
            .then((wid) => {
              if (wid != null) {
                setWishlistOverride((prev) => ({ ...prev, [listingId]: wid }));
                showToast('이미 위시리스트에 저장한 숙소예요');
              } else {
                setSaveFor(listingId);
              }
            })
            .catch(() => setSaveFor(listingId));
        },
        { type: 'saveHeart', listingId, from: window.location.pathname },
      );
      return;
    }
    const wishlistId = wishlistIdOf(c);
    if (wishlistId == null) {
      setSaveFor(listingId);
      return;
    }
    // 낙관적 해제 후 DELETE — 실패 시 wishlistId 복원
    setWishlistOverride((prev) => ({ ...prev, [listingId]: null }));
    removeWishlistItem(wishlistId, listingId)
      .then(() => showToast('위시리스트에서 삭제했어요'))
      .catch(() => {
        setWishlistOverride((prev) => ({ ...prev, [listingId]: wishlistId }));
        showToast('삭제에 실패했어요');
      });
  };

  const onSaved = (wishlistName: string, wishlistId: number) => {
    if (saveFor !== null) setWishlistOverride((prev) => ({ ...prev, [saveFor]: wishlistId }));
    setSaveFor(null);
    showToast(`'${wishlistName}'에 저장했어요`);
  };

  return { isLiked, onHeart, saveFor, setSaveFor, onSaved, toast };
}
