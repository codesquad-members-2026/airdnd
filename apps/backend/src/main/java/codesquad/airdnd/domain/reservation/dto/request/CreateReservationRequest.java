package codesquad.airdnd.domain.reservation.dto.request;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import codesquad.airdnd.domain.reservation.entity.GuestCounts;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateReservationRequest(
	@NotNull(message = "체크인 날짜를 입력해주세요.")
	@FutureOrPresent(message = "체크인 날짜는 오늘 이후여야 합니다.")
	@JsonFormat(pattern = "yyyy-MM-dd")
	LocalDate checkInDate,

	@NotNull(message = "체크아웃 날짜를 입력해주세요.")
	@Future(message = "체크아웃 날짜는 미래여야 합니다.")
	@JsonFormat(pattern = "yyyy-MM-dd")
	LocalDate checkOutDate,

	@Min(value = 1, message = "성인은 1명 이상이어야 합니다.") int adultGuestNum,
	@Min(value = 0, message = "어린이는 0명 이상이어야 합니다.") int childGuestNum,
	@Min(value = 0, message = "유아는 0명 이상이어야 합니다.") int babyGuestNum,
	@Min(value = 0, message = "반려동물은 0마리 이상이어야 합니다.") int petGuestNum
) {
	public GuestCounts toGuestCounts() {
		return GuestCounts.create(adultGuestNum, childGuestNum, babyGuestNum, petGuestNum);
	}
}
