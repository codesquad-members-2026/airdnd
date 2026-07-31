import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { WishlistSummary } from '../model/wishlistTypes';

export function WishlistFolderCard({ wishlist }: { wishlist: WishlistSummary }) {
  const cover = wishlist.coverImageUrl?.trim() ? wishlist.coverImageUrl : null;
  return (
    <Link className="wishlist-folder-card" to={`/wishlists/${wishlist.id}`}>
      <div className="wishlist-folder-cover" aria-hidden="true">
        {cover ? <img src={cover} alt="" loading="lazy" /> : null}
        <span className="wishlist-folder-icon">
          <Heart size={15} />
        </span>
      </div>
      <div className="wishlist-folder-body">
        <h2>{wishlist.name}</h2>
        <span className="wishlist-folder-count">숙소 {wishlist.roomCount}개</span>
      </div>
    </Link>
  );
}
