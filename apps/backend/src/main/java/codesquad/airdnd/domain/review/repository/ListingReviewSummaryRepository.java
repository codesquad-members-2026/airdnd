package codesquad.airdnd.domain.review.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import codesquad.airdnd.domain.review.entity.ListingReviewSummary;

public interface ListingReviewSummaryRepository extends JpaRepository<ListingReviewSummary, Long> {
}
