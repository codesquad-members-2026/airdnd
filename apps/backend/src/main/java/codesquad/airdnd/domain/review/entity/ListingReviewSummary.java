package codesquad.airdnd.domain.review.entity;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 리뷰 점수 역정규화 통계 (listing 1:1).
 * 버킷(rating1~5Count)만 저장하고 reviewCount/averageRating은 버킷에서 파생한다.
 * DB에는 동일 식을 GENERATED STORED 컬럼으로 두어 정렬/필터 인덱스에 사용한다.
 */
@Entity
@Table(name = "listing_review_summary")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ListingReviewSummary {

	private static final int MIN_RATING = 1;
	private static final int MAX_RATING = 5;

	@Id
	private Long listingId;

	@MapsId
	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "listing_id")
	private Listing listing;

	@Column(name = "rating_1_count", nullable = false)
	private int rating1Count;

	@Column(name = "rating_2_count", nullable = false)
	private int rating2Count;

	@Column(name = "rating_3_count", nullable = false)
	private int rating3Count;

	@Column(name = "rating_4_count", nullable = false)
	private int rating4Count;

	@Column(name = "rating_5_count", nullable = false)
	private int rating5Count;

	private ListingReviewSummary(Listing listing) {
		this.listing = listing;
	}

	public static ListingReviewSummary create(Listing listing) {
		return new ListingReviewSummary(listing);
	}

	public void addRating(int rating) {
		validate(rating);
		adjust(rating, 1);
	}

	public void removeRating(int rating) {
		validate(rating);
		adjust(rating, -1);
	}

	public void changeRating(int oldRating, int newRating) {
		removeRating(oldRating);
		addRating(newRating);
	}

	public int getReviewCount() {
		return rating1Count + rating2Count + rating3Count + rating4Count + rating5Count;
	}

	public Double getAverageRating() {
		int count = getReviewCount();
		if (count == 0) {
			return null;
		}
		int sum = rating1Count
			+ 2 * rating2Count
			+ 3 * rating3Count
			+ 4 * rating4Count
			+ 5 * rating5Count;
		return (double)sum / count;
	}

	private void adjust(int rating, int delta) {
		switch (rating) {
			case 1 -> rating1Count += delta;
			case 2 -> rating2Count += delta;
			case 3 -> rating3Count += delta;
			case 4 -> rating4Count += delta;
			case 5 -> rating5Count += delta;
			default -> throw new BusinessException(ErrorCode.INVALID_REVIEW_RATING);
		}
	}

	private void validate(int rating) {
		if (rating < MIN_RATING || rating > MAX_RATING) {
			throw new BusinessException(ErrorCode.INVALID_REVIEW_RATING);
		}
	}
}
