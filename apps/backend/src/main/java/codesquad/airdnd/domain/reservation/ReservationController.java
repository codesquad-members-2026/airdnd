package codesquad.airdnd.domain.reservation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import codesquad.airdnd.domain.reservation.dto.request.CreateReservationRequest;
import codesquad.airdnd.domain.reservation.dto.response.CancelPreview;
import codesquad.airdnd.domain.reservation.dto.response.ReservationDetailResponse;
import codesquad.airdnd.domain.reservation.dto.response.ReservationSummary;
import codesquad.airdnd.domain.reservation.dto.response.UpcomingReservationResponse;
import codesquad.airdnd.global.ApiResponse;
import codesquad.airdnd.global.auth.CurrentMember;
import codesquad.airdnd.global.auth.CurrentMemberInfo;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ReservationController {
	private final ReservationService reservationService;

	@Operation(summary = "게스트 숙소 예약")
	@PostMapping("/listings/{listingId}/reservations")
	public ResponseEntity<ApiResponse<ReservationSummary>> createReservation(
		@CurrentMember CurrentMemberInfo guest, @PathVariable Long listingId,
		@RequestBody @Valid CreateReservationRequest request
	) {
		ReservationSummary response = reservationService.createReservation(guest.id(), listingId, request);
		return ResponseEntity.status(HttpStatus.CREATED)
			.body(ApiResponse.success(response));
	}

	@Operation(summary = "예약 상세 보기")
	@GetMapping("/reservations/{reservationId}")
	public ResponseEntity<ApiResponse<ReservationDetailResponse>> getReservation(
		@CurrentMember CurrentMemberInfo guest, @PathVariable Long reservationId
	) {
		ReservationDetailResponse response = reservationService.getReservationDetail(guest.id(), reservationId);
		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@Operation(summary = "게스트가 예약 취소 시 환불 정책, 남은 기간 계산한 환불 금액, 수수료 등 미리보기")
	@GetMapping("/reservations/{reservationId}/cancel-preview")
	public ResponseEntity<ApiResponse<CancelPreview>> cancelPreview(
		@CurrentMember CurrentMemberInfo guest, @PathVariable Long reservationId
	) {
		CancelPreview response = reservationService.getCancelPreview(guest.id(), reservationId);
		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@Operation(summary = "게스트의 예약 취소")
	@PostMapping("/reservations/{reservationId}/cancel")
	public ResponseEntity<ApiResponse<Void>> cancelReservation(
		@CurrentMember CurrentMemberInfo guest, @PathVariable Long reservationId
	) {
		reservationService.cancelReservation(guest.id(), reservationId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@Operation(summary = "게스트 예약 목록")
	@GetMapping("/me/reservations")
	public ResponseEntity<ApiResponse<UpcomingReservationResponse>> getMyReservations(
		@CurrentMember CurrentMemberInfo memberInfo
	) {
		UpcomingReservationResponse reservations = reservationService.getUpcomingReservations(memberInfo.id());
		return ResponseEntity.ok(ApiResponse.success(reservations));
	}
}
