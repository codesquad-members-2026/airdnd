package codesquad.airdnd.domain.reservation;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

import codesquad.airdnd.domain.listing.repository.ListingRepository;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.domain.reservation.dto.request.CreateReservationRequest;
import codesquad.airdnd.domain.reservation.dto.response.ReservationSummary;
import codesquad.airdnd.domain.reservation.entity.Reservation;
import codesquad.airdnd.domain.reservation.entity.ReservationDate;
import codesquad.airdnd.domain.reservation.entity.ReservationState;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

	@Mock
	private ReservationRepository resRepository;

	@Mock
	private ReservationDateRepository resDateRepository;

	@Mock
	private ListingRepository listingRepository;

	@Mock
	private MemberRepository memberRepository;

	@InjectMocks
	private ReservationService reservationService;

	private static final Long GUEST_ID = 1L;
	private static final Long LISTING_ID = 10L;

	private Member guest;
	private Listing listing;

	@BeforeEach
	void setUp() {
		guest = Member.builder().nickname("guest").build();
		ReflectionTestUtils.setField(guest, "id", GUEST_ID);

		listing = Listing.builder()
			.name("테스트 숙소")
			.pricePerNight(BigDecimal.valueOf(50000))
			.build();
		ReflectionTestUtils.setField(listing, "id", LISTING_ID);
	}

	private CreateReservationRequest request() {
		return new CreateReservationRequest(
			LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3),
			2, 0, 0, 0
		);
	}

	@Nested
	@DisplayName("예약 생성 (createReservation)")
	class CreateReservation {

		@Test
		@DisplayName("유효한 요청으로 예약하면 예약과 예약 날짜가 저장된다")
		void savesReservationAndDates() {
			// given
			given(listingRepository.findById(LISTING_ID)).willReturn(Optional.of(listing));
			given(memberRepository.getReferenceById(GUEST_ID)).willReturn(guest);

			// when
			reservationService.createReservation(GUEST_ID, LISTING_ID, request());

			// then
			then(resRepository).should(times(1)).save(any(Reservation.class));
			then(resDateRepository).should(times(1)).saveAll(anyList());
		}

		@Test
		@DisplayName("2박 예약 시 예약 날짜 2건이 저장된다")
		void savesDatePerNight() {
			// given
			given(listingRepository.findById(LISTING_ID)).willReturn(Optional.of(listing));
			given(memberRepository.getReferenceById(GUEST_ID)).willReturn(guest);

			// when
			reservationService.createReservation(GUEST_ID, LISTING_ID, request());

			// then
			then(resDateRepository).should().saveAll(argThat((List<ReservationDate> dates) -> dates.size() == 2));
		}

		@Test
		@DisplayName("응답에 예약 정보가 올바르게 매핑된다")
		void mapsResponse() {
			// given
			given(listingRepository.findById(LISTING_ID)).willReturn(Optional.of(listing));
			given(memberRepository.getReferenceById(GUEST_ID)).willReturn(guest);

			// when
			ReservationSummary response = reservationService.createReservation(GUEST_ID, LISTING_ID, request());

			// then
			assertThat(response.listingId()).isEqualTo(LISTING_ID);
			assertThat(response.listingTitle()).isEqualTo("테스트 숙소");
			assertThat(response.checkInDate()).isEqualTo(LocalDate.of(2026, 7, 1));
			assertThat(response.checkOutDate()).isEqualTo(LocalDate.of(2026, 7, 3));
			assertThat(response.totalPrice()).isEqualByComparingTo(BigDecimal.valueOf(100000));
			assertThat(response.state()).isEqualTo(ReservationState.PENDING);
			assertThat(response.guestCounts().adultGuestNum()).isEqualTo(2);
		}

		@Test
		@DisplayName("존재하지 않는 숙소면 LISTING_NOT_FOUND 예외가 발생한다")
		void throwsWhenListingNotFound() {
			// given
			given(listingRepository.findById(LISTING_ID)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> reservationService.createReservation(GUEST_ID, LISTING_ID, request()))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.LISTING_NOT_FOUND);

			then(resRepository).should(never()).save(any());
		}

		@Test
		@DisplayName("예약 날짜가 중복되어 제약 위반이 발생하면 ALREADY_RESERVED 예외로 변환된다")
		void translatesConstraintViolationToAlreadyReserved() {
			// given
			given(listingRepository.findById(LISTING_ID)).willReturn(Optional.of(listing));
			given(memberRepository.getReferenceById(GUEST_ID)).willReturn(guest);
			given(resDateRepository.saveAll(anyList())).willThrow(new DataIntegrityViolationException("duplicate"));

			// when & then
			assertThatThrownBy(() -> reservationService.createReservation(GUEST_ID, LISTING_ID, request()))
				.isInstanceOf(BusinessException.class)
				.extracting(e -> ((BusinessException) e).getErrorCode())
				.isEqualTo(ErrorCode.ALREADY_RESERVED);
		}
	}
}
