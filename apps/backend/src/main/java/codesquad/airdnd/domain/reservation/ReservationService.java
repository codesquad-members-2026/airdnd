package codesquad.airdnd.domain.reservation;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import codesquad.airdnd.global.auth.CurrentMemberInfo;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import codesquad.airdnd.domain.listing.repository.ListingImageRepository;
import codesquad.airdnd.domain.listing.repository.ListingRepository;
import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.domain.reservation.dto.request.CreateReservationRequest;
import codesquad.airdnd.domain.reservation.dto.response.CancelPreview;
import codesquad.airdnd.domain.reservation.dto.response.ReservationDetailResponse;
import codesquad.airdnd.domain.reservation.dto.response.ReservationSummary;
import codesquad.airdnd.domain.reservation.dto.response.UpcomingReservationResponse;
import codesquad.airdnd.domain.reservation.entity.GuestCounts;
import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.domain.reservation.entity.ReservationDate;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import codesquad.airdnd.global.region.RegionCodeService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservationService {
	private final ReservationRepository resRepository;
	private final ReservationDateRepository resDateRepository;

	private final ListingRepository listingRepository;
	private final ListingImageRepository listingImageRepository;
	private final MemberRepository memberRepository;

	private final RegionCodeService regionCodeService;

	private final Clock clock;

	@Transactional
	public ReservationSummary createReservation(
		Long guestId, Long listingId,
		CreateReservationRequest request
	) {
		Listing listing = listingRepository.findById(listingId)
			.orElseThrow(() -> new BusinessException(ErrorCode.LISTING_NOT_FOUND));

		if (!listing.isApproved()) {
			throw new BusinessException(ErrorCode.LISTING_NOT_APPROVED);
		}

		Member guest = memberRepository.getReferenceById(guestId);

		GuestCounts guestCounts = request.toGuestCounts();
		Reservation reservation = Reservation.create(
			guest,
			listing, request.checkInDate(),
			request.checkOutDate(),
			guestCounts
		);

		resRepository.save(reservation);
		List<ReservationDate> dates = ReservationDate.from(reservation);

		try {
			resDateRepository.saveAll(dates);
			resDateRepository.flush();
		} catch (DataIntegrityViolationException e) {
			throw new BusinessException(ErrorCode.ALREADY_RESERVED);
		}

		return ReservationSummary.from(reservation);
	}

	@Transactional(readOnly = true)
	public UpcomingReservationResponse getUpcomingReservations(Long userId) {
		List<Reservation> upcoming = resRepository.findUpcoming(userId, LocalDate.now(clock));
		return toResponse(upcoming);
	}

	@Transactional(readOnly = true)
	public UpcomingReservationResponse getPastReservations(Long userId) {
		List<Reservation> past = resRepository.findPast(userId, LocalDate.now(clock));
		return toResponse(past);
	}

	// 예약 목록 → 응답(커버 이미지 배치 조회로 채움). 목록 조회 공통
	private UpcomingReservationResponse toResponse(List<Reservation> reservations) {
		List<Long> listingIds = reservations.stream()
			.map(r -> r.getListing().getId())
			.distinct()
			.toList();
		Map<Long, String> coverByListing = listingIds.isEmpty()
			? Map.of()
			: listingImageRepository.findCoverByListingIds(listingIds);

		List<ReservationSummary> list = reservations.stream()
			.map(r -> toSummary(r, coverByListing.get(r.getListing().getId())))
			.toList();
		return new UpcomingReservationResponse(list);
	}

	@Transactional(readOnly = true)
	public ReservationDetailResponse getReservationDetail(Long userId, Long reservationId) {
		Reservation reservation = resRepository.findDetailById(reservationId)
			.orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

		Address address = reservation.getListing().getAddress();
		String addressSummary = regionCodeService.getAddressSummary(address.getSidoCode(), address.getSigunguCode());

		if (reservation.isOwnedBy(userId)) {
			return ReservationDetailResponse.forGuest(reservation, addressSummary);
		} else {
			throw new BusinessException(ErrorCode.NOT_RESERVATION_OWNER);
		}
	}

	public CancelPreview getCancelPreview(Long guestId, Long reservationId) {
		Reservation reservation = getOwnedReservation(guestId, reservationId);

		// 환불액 계산 로직
		BigDecimal refundAmount = reservation.getTotalPrice();

		return new CancelPreview(refundAmount);
	}

	@Transactional
	public Reservation cancelReservation(Long guestId, Long reservationId) {
		Reservation reservation = getOwnedReservation(guestId, reservationId);

		reservation.cancelByGuest();
		resDateRepository.deleteByReservationId(reservationId);

        return reservation;
	}

	private Reservation getOwnedReservation(Long guestId, Long reservationId) {
		Reservation reservation = resRepository.findById(reservationId)
			.orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

		if (!reservation.isOwnedBy(guestId)) {
			throw new BusinessException(ErrorCode.NOT_RESERVATION_OWNER);
		}

		return reservation;
	}

	private ReservationSummary toSummary(Reservation r, String coverImage) {
		Address address = r.getListing().getAddress();
		String region = regionCodeService.getAddressSummary(address.getSidoCode(), address.getSigunguCode());
		return ReservationSummary.from(r, region, coverImage);
	}

    @Transactional
    public void releaseHold(Long reservationId){
        Reservation reservation = resRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

        reservation.expireInPending();
        resDateRepository.deleteByReservationId(reservationId);
    }
}
