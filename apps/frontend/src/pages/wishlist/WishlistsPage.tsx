import { useWishlistsQuery } from '../../features/wishlist/api/wishlistQueries';
import { CreateWishlistButton } from '../../features/wishlist/ui/CreateWishlistButton';
import { WishlistFolderCard } from '../../features/wishlist/ui/WishlistFolderCard';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';

export function WishlistsPage() {
  const wishlistsQuery = useWishlistsQuery();

  return (
    <section className="stack">
      <div className="wishlist-page-head">
        <div className="page-heading">
          <p className="eyebrow">Wishlists</p>
          <h1>위시리스트</h1>
        </div>
        <CreateWishlistButton />
      </div>
      {wishlistsQuery.isLoading ? <Loading message="위시리스트를 불러오는 중입니다." /> : null}
      {wishlistsQuery.error ? <ErrorMessage error={wishlistsQuery.error} /> : null}
      {wishlistsQuery.data ? (
        wishlistsQuery.data.length === 0 ? (
          <EmptyState
            title="아직 위시리스트가 없습니다."
            description="마음에 드는 숙소를 저장하면 여기에서 모아볼 수 있습니다."
          />
        ) : (
          <div className="wishlist-folder-grid">
            {wishlistsQuery.data.map((wishlist) => (
              <WishlistFolderCard key={wishlist.id} wishlist={wishlist} />
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}
