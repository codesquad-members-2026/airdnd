package codesquad.airdnd.domain.wishlistItem;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode
public class WishlistItemId implements Serializable {

    @Column(name = "wishlist_id")
    private Long wishlistId;

    @Column(name = "listing_id")
    private Long listingId;
}
