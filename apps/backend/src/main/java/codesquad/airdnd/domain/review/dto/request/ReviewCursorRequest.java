package codesquad.airdnd.domain.review.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ReviewCursorRequest(
	Long cursor,

	@Min(1)
	@Max(MAX_SIZE)
	Integer size
) {
	private static final int DEFAULT_SIZE = 20;
	private static final int MAX_SIZE = 50;

	public long cursorOrMax() {
		return cursor == null ? Long.MAX_VALUE : cursor;
	}

	public int sizeOrDefault() {
		return size == null ? DEFAULT_SIZE : size;
	}
}
