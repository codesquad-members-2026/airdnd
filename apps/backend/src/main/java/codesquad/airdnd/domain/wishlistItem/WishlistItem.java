package codesquad.airdnd.domain.wishlistItem;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.wishlist.entity.Wishlist;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "wishlist_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WishlistItem {

    @EmbeddedId
    private WishlistItemId id = new WishlistItemId();

    @MapsId("wishlistId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wishlist_id", nullable = false)
    private Wishlist wishlist;

    @MapsId("listingId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    private String note;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    protected WishlistItem(Wishlist wishlist, Listing listing, String note) {
        this.wishlist = wishlist;
        this.listing = listing;
        this.note = note;
    }

    public void updateNote(String note){
        this.note = note;
    }
}
