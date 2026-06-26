package codesquad.airdnd.domain.listing.dto.query;

public record MapBoundsFilter(
	Double south,
	Double north,
	Double west,
	Double east
) {
	public boolean isPresent() {
		return south != null && north != null && west != null && east != null;
	}

	public String toPolygonWkt() {
		return String.format(
			"POLYGON((%f %f, %f %f, %f %f, %f %f, %f %f))",
			west, south,
			east, south,
			east, north,
			west, north,
			west, south
		);
	}
}
