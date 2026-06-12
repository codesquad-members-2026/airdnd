import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useWishlistQuery } from '../../features/wishlist/api/wishlistQueries';
import { RoomCard } from '../../features/rooms/ui/RoomCard';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';

export function WishlistDetailPage() {
  const { wishlistId } = useParams();
  const parsedId = wishlistId ? Number(wishlistId) : undefined;
  const wishlistQuery = useWishlistQuery(parsedId);

  return (
    <section className="stack">
      <div className="page-heading">
        <Link className="back-link" to="/wishlists">
          <ChevronLeft size={16} />
          위시리스트
        </Link>
        <p className="eyebrow">Wishlist</p>
        <h1>{wishlistQuery.data?.name ?? '위시리스트'}</h1>
      </div>
      {wishlistQuery.isLoading ? <Loading message="저장한 숙소를 불러오는 중입니다." /> : null}
      {wishlistQuery.error ? <ErrorMessage error={wishlistQuery.error} /> : null}
      {wishlistQuery.data ? (
        wishlistQuery.data.wishlistedRooms.length === 0 ? (
          <EmptyState
            title="아직 저장한 숙소가 없습니다."
            description="숙소를 둘러보고 마음에 드는 곳을 이 목록에 담아 보세요."
          />
        ) : (
          <div className="room-grid">
            {wishlistQuery.data.wishlistedRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}
