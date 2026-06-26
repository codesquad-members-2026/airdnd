package codesquad.airdnd.domain.reservation.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Reservation {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long reservationId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "guest_id")
	private Member guest;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "listing_id")
	private Listing listing;

	private LocalDate checkInDate;
	private LocalDate checkOutDate;

	@Enumerated(value = EnumType.STRING)
	private ReservationState state;

	@Embedded
	private GuestCounts guestCounts;

	private BigDecimal totalPrice;

	@Builder(access = AccessLevel.PRIVATE)
	private Reservation(
		Member guest,
		Listing listing,
		LocalDate checkInDate,
		LocalDate checkOutDate,
		GuestCounts guestCounts,
		ReservationState state,
		BigDecimal totalPrice
	) {
		this.guest = guest;
		this.listing = listing;
		this.checkInDate = checkInDate;
		this.checkOutDate = checkOutDate;
		this.guestCounts = guestCounts;
		this.state = state;
		this.totalPrice = totalPrice;
	}

	public static Reservation create(
		Member guest, Listing listing, LocalDate checkInDate, LocalDate checkOutDate, GuestCounts guestCounts
	) {
		validateDates(checkInDate, checkOutDate);

		long nights = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
		BigDecimal pricePerNight = listing.getPricePerNight();
		BigDecimal totalPrice = calculateTotalPrice(nights, pricePerNight);

		return Reservation.builder()
			.guest(guest)
			.listing(listing)
			.checkInDate(checkInDate)
			.checkOutDate(checkOutDate)
			.guestCounts(guestCounts)
			.state(ReservationState.PENDING)
			.totalPrice(totalPrice)
			.build();
	}


	public boolean isOwnedBy(Long userId) {
		return userId.equals(guest.getId());
	}

	public boolean isHostOf(Long userId) {
		Long hostId = listing.getHost().getId();
		return userId.equals(hostId);
	}

	public void cancelByGuest() {
		if (state != ReservationState.CONFIRMED) {
			throw new BusinessException(ErrorCode.RESERVATION_NOT_CANCELABLE);
		}
		state = ReservationState.GUEST_CANCELED;
	}
    public void expireInPending(){
        if(this.state != ReservationState.PENDING){
            throw new BusinessException(ErrorCode.RESERVATION_NOT_CANCELABLE);
        }

        this.state = ReservationState.EXPIRED;
    }

	private static void validateDates(LocalDate checkInDate, LocalDate checkOutDate) {
		if (!checkOutDate.isAfter(checkInDate)) {
			throw new BusinessException(ErrorCode.INVALID_RESERVATION_DATE);
		}
	}

	private static BigDecimal calculateTotalPrice(long nights, BigDecimal pricePerNight) {
		return pricePerNight.multiply(BigDecimal.valueOf(nights));
	}

    public boolean isPending(){
        return state == ReservationState.PENDING;
    }

    public void confirm(){
        this.state = ReservationState.CONFIRMED;
    }

	public boolean isCompleted() {
		return state == ReservationState.COMPLETED;
	}
}
