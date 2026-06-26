package codesquad.airdnd.domain.review.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review {

	private static final int MIN_RATING = 1;
	private static final int MAX_RATING = 5;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(columnDefinition = "TEXT")
	private String content;

	@JdbcTypeCode(SqlTypes.TINYINT)
	@Column(nullable = false)
	private int rating;

	@CreationTimestamp
	@Column(updatable = false)
	private LocalDateTime createdAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "member_id", nullable = false)
	private Member author;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "reservation_id", nullable = false, unique = true)
	private Reservation reservation;

	@Builder(access = AccessLevel.PRIVATE)
	private Review(Member author, Reservation reservation, int rating, String content) {
		this.author = author;
		this.reservation = reservation;
		this.rating = rating;
		this.content = content;
	}

	public static Review create(Reservation reservation, Member author, int rating, String content) {
		validateOwner(reservation, author);
		validateCompleted(reservation);
		validateRating(rating);

		return Review.builder()
			.author(author)
			.reservation(reservation)
			.rating(rating)
			.content(content)
			.build();
	}

	public boolean isWrittenBy(Long memberId) {
		return author.getId().equals(memberId);
	}

	public Long getListingId() {
		return reservation.getListing().getId();
	}

	private static void validateOwner(Reservation reservation, Member author) {
		if (!reservation.isOwnedBy(author.getId())) {
			throw new BusinessException(ErrorCode.REVIEW_NOT_RESERVATION_OWNER);
		}
	}

	private static void validateCompleted(Reservation reservation) {
		if (!reservation.isCompleted()) {
			throw new BusinessException(ErrorCode.REVIEW_RESERVATION_NOT_COMPLETED);
		}
	}

	private static void validateRating(int rating) {
		if (rating < MIN_RATING || rating > MAX_RATING) {
			throw new BusinessException(ErrorCode.INVALID_REVIEW_RATING);
		}
	}
}
