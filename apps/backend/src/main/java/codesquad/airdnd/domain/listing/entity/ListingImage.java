package codesquad.airdnd.domain.listing.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "listing_image")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ListingImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Builder
    protected ListingImage(String imageUrl, int sortOrder) {
        this.imageUrl = imageUrl;
        this.sortOrder = sortOrder;
    }

    public void assignListing(Listing listing) {
        this.listing = listing;
    }

    public static List<ListingImage> from(List<String> imageUrls) {
        List<ListingImage> images = new ArrayList<>();

        for (String url : imageUrls) {
            ListingImage listingImage = ListingImage.builder()
                .imageUrl(url)
                .sortOrder(images.size())
                .build();

            images.add(listingImage);
        }
        return images;
    }
}
