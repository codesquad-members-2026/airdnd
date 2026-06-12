import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { WishlistSummary } from '../model/wishlistTypes';

export function WishlistFolderCard({ wishlist }: { wishlist: WishlistSummary }) {
  return (
    <Link className="wishlist-folder-card" to={`/wishlists/${wishlist.id}`}>
      <span className="wishlist-folder-icon" aria-hidden="true">
        <Heart size={20} />
      </span>
      <div className="wishlist-folder-body">
        <h2>{wishlist.name}</h2>
        <p className="muted">저장한 숙소 {wishlist.roomCount}개</p>
      </div>
    </Link>
  );
}
