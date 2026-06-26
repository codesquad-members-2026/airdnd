package codesquad.airdnd.domain.listing.dto.query;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;

public record DateRangeFilter(
	@FutureOrPresent(message = "체크인 날짜는 오늘 이후여야 합니다.")
	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	LocalDate checkIn,

	@Future(message = "체크아웃 날짜는 미래여야 합니다.")
	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	LocalDate checkOut
) {
	public boolean isPresent() {
		return checkIn != null && checkOut != null;
	}

	public boolean isValidRange() {
		return !isPresent() || checkOut.isAfter(checkIn);
	}
}
