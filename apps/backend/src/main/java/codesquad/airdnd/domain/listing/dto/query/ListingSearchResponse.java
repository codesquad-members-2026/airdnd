package codesquad.airdnd.domain.listing.dto.query;

import java.math.BigDecimal;

import org.locationtech.jts.geom.Point;


import codesquad.airdnd.domain.listing.entity.Capacity;

public record ListingSearchResponse(
	Long id,
	Point point,
	String name,
	Capacity capacity,
	BigDecimal pricePerNight
) {
	public double getLatitude() {
		return point.getY();
	}

	public double getLongitude() {
		return point.getX();
	}
}
