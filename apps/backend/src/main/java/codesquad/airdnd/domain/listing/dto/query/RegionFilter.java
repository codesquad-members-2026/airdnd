package codesquad.airdnd.domain.listing.dto.query;

public record RegionFilter(
	String sidoCode,
	String sigunguCode
) {
	public boolean hasSido() {
		return sidoCode != null && !sidoCode.isBlank();
	}

	public boolean hasSigungu() {
		return sigunguCode != null && !sigunguCode.isBlank();
	}

	public boolean isPresent() {
		return hasSido() || hasSigungu();
	}
}
