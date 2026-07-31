import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import {
  useWishlistQuery,
  useWishlistRoomsQuery,
} from '../../features/wishlist/api/wishlistQueries';
import { RoomCard } from '../../features/rooms/ui/RoomCard';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { InfiniteScrollSentinel } from '../../shared/ui/InfiniteScrollSentinel';
import { Loading } from '../../shared/ui/Loading';

export function WishlistDetailPage() {
  const { wishlistId } = useParams();
  const parsedId = wishlistId ? Number(wishlistId) : undefined;
  // 폴더 이름은 메타에서, 저장 숙소는 커서 무한 스크롤로 한 페이지씩.
  const metaQuery = useWishlistQuery(parsedId);
  const roomsQuery = useWishlistRoomsQuery(parsedId);
  const rooms = roomsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section className="stack">
      <div className="page-heading">
        <Link className="back-link" to="/wishlists">
          <ChevronLeft size={16} />
          위시리스트
        </Link>
        <p className="eyebrow">Wishlist</p>
        <h1>{metaQuery.data?.name ?? '위시리스트'}</h1>
        {metaQuery.data ? (
          <p className="wishlist-lead">저장한 숙소 {metaQuery.data.roomCount}개</p>
        ) : null}
      </div>
      {roomsQuery.isLoading ? <Loading message="저장한 숙소를 불러오는 중입니다." /> : null}
      {roomsQuery.error ? <ErrorMessage error={roomsQuery.error} /> : null}
      {roomsQuery.data ? (
        rooms.length === 0 ? (
          <EmptyState
            title="아직 저장한 숙소가 없습니다."
            description="숙소를 둘러보고 마음에 드는 곳을 이 목록에 담아 보세요."
          />
        ) : (
          <>
            <div className="room-grid">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
            <InfiniteScrollSentinel
              onReachEnd={() => roomsQuery.fetchNextPage()}
              hasNext={roomsQuery.hasNextPage}
              isFetching={roomsQuery.isFetchingNextPage}
            />
          </>
        )
      ) : null}
    </section>
  );
}
