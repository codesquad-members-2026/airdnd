package codesquad.airdnd.domain.listing.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.member.Member;

public interface ListingRepository extends JpaRepository<Listing, Long> {
	List<Listing> findAllByHost(Member member);
}
