package codesquad.airdnd.domain.listing.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;

import codesquad.airdnd.domain.listing.dto.query.DateRangeFilter;
import codesquad.airdnd.domain.listing.dto.query.GuestCountFilter;
import codesquad.airdnd.domain.listing.dto.query.ListingSearchResponse;
import codesquad.airdnd.domain.listing.dto.query.MapBoundsFilter;
import codesquad.airdnd.domain.listing.dto.query.PriceRangeFilter;
import codesquad.airdnd.domain.listing.dto.query.RegionFilter;
import codesquad.airdnd.domain.listing.dto.request.ListingSearchCondition;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.ListingState;
import lombok.RequiredArgsConstructor;

import static codesquad.airdnd.domain.listing.entity.QListing.listing;
import static codesquad.airdnd.domain.reservation.entity.QReservationDate.reservationDate;

@Repository
@RequiredArgsConstructor
public class ListingQueryRepositoryImpl implements ListingQueryRepository {
	private final JPAQueryFactory queryFactory;

	@Override
	public Page<ListingSearchResponse> searchListings(ListingSearchCondition condition, Pageable pageable) {
		List<ListingSearchResponse> contents = queryFactory
			.select(
				Projections.constructor(
					ListingSearchResponse.class,
					listing.id,
					listing.address.latLng,
					listing.name,
					listing.capacity,
					listing.pricePerNight
				)
			)
			.from(listing)
			.where(filters(condition))
			.orderBy(listing.id.desc())
			.offset(pageable.getOffset())
			.limit(pageable.getPageSize())
			.fetch();

		JPAQuery<Long> countQuery = queryFactory
			.select(listing.count())
			.from(listing)
			.where(filters(condition));

		return PageableExecutionUtils.getPage(
			contents,
			pageable,
			countQuery::fetchOne
		);
	}

	@Override
	public Optional<Listing> findDetailById(Long listingId) {
		Listing result = queryFactory
			.selectFrom(listing)
			.join(listing.host).fetchJoin()
			.where(
				listing.id.eq(listingId),
				listing.state.eq(ListingState.APPROVED)
			)
			.fetchOne();

		return Optional.ofNullable(result);
	}

	private BooleanExpression[] filters(ListingSearchCondition condition) {
		return new BooleanExpression[] {
			listing.state.eq(ListingState.APPROVED),
			withinBounds(condition.mapBounds()),
			inRegion(condition.region()),
			priceGoe(condition.priceRange()),
			priceLoe(condition.priceRange()),
			capacityGoe(condition.guestCount()),
			availableBetween(condition.dateRange())
		};
	}

	private BooleanExpression withinBounds(MapBoundsFilter bounds) {
		if (bounds == null || !bounds.isPresent()) {
			return null;
		}

		return Expressions.numberTemplate(
			Integer.class,
			"MBRContains(ST_GeomFromText({0}, 4326, 'axis-order=long-lat'), {1})",
			bounds.toPolygonWkt(),
			listing.address.latLng
		).eq(1);
	}

	private BooleanExpression inRegion(RegionFilter region) {
		if (region == null || !region.isPresent()) {
			return null;
		}

		BooleanExpression expression = null;
		if (region.hasSido()) {
			expression = listing.address.sidoCode.eq(region.sidoCode());
		}
		if (region.hasSigungu()) {
			BooleanExpression sigungu = listing.address.sigunguCode.eq(region.sigunguCode());
			expression = expression == null ? sigungu : expression.and(sigungu);
		}
		return expression;
	}

	private BooleanExpression priceGoe(PriceRangeFilter priceRange) {
		if (priceRange == null || priceRange.minPrice() == null) {
			return null;
		}
		return listing.pricePerNight.goe(priceRange.minPrice());
	}

	private BooleanExpression priceLoe(PriceRangeFilter priceRange) {
		if (priceRange == null || priceRange.maxPrice() == null) {
			return null;
		}
		return listing.pricePerNight.loe(priceRange.maxPrice());
	}

	private BooleanExpression capacityGoe(GuestCountFilter guestCount) {
		if (guestCount == null) {
			return null;
		}
		int headcount = nz(guestCount.adults()) + nz(guestCount.children());
		if (headcount <= 0) {
			return null;
		}
		return listing.capacity.maxGuests.goe(headcount);
	}

	private BooleanExpression availableBetween(DateRangeFilter dateRange) {
		if (dateRange == null || !dateRange.isPresent()) {
			return null;
		}

		return JPAExpressions
			.selectOne()
			.from(reservationDate)
			.where(
				reservationDate.listingId.eq(listing.id),
				reservationDate.stayDate.goe(dateRange.checkIn()),
				reservationDate.stayDate.lt(dateRange.checkOut())
			)
			.notExists();
	}

	private int nz(Integer value) {
		return value == null ? 0 : value;
	}
}
