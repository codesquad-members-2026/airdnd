package codesquad.airdnd.domain.listing.dto.request;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import codesquad.airdnd.domain.listing.entity.Address;
import codesquad.airdnd.domain.listing.entity.Amenity;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.listing.entity.ListingImage;
import codesquad.airdnd.domain.listing.entity.RoomType;
import codesquad.airdnd.domain.member.Member;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ListingCreateRequest(
	@NotBlank(message = "숙소 이름을 입력해주세요.") String name,

	@NotBlank(message = "도로명 주소를 입력해주세요.") String roadAddress,
	@NotBlank(message = "상세 주소를 입력해주세요.")
	@Size(max = 50, message = "상세 주소는 50자 이하로 입력해주세요.") String detailAddress,
	@NotBlank(message = "우편번호를 입력해주세요.")
	@Pattern(regexp = "\\d{5}", message = "우편번호는 5자리 숫자여야 합니다.") String postalCode,

	@NotNull
	@DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
	@DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다.")
	Double latitude,

	@NotNull
	@DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
	@DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다.")
	Double longitude,

	@NotNull(message = "숙소 유형을 선택해주세요.") RoomType roomType,

	@Min(value = 1, message = "최대 인원은 1명 이상이어야 합니다.") int maxGuests,
	@Min(value = 0, message = "침실 수는 0개 이상이어야 합니다.") int bedrooms,
	@Min(value = 1, message = "침대 수는 1개 이상이어야 합니다.") int beds,
	@Min(value = 0, message = "욕실 수는 0개 이상이어야 합니다.") int bathrooms,

	@Size(min = 5, message = "숙소 이미지는 최소 5개 이상이어햐 합니다.") List<String> images,

	String description,

	@NotNull(message = "1박 요금을 입력해주세요.")
	@Positive(message = "1박 요금은 0원보다 커야 합니다.")
	@Digits(integer = 10, fraction = 2, message = "1박 요금은 최대 10자리 정수, 소수점 2자리까지 입력 가능합니다.")
	BigDecimal pricePerNight,

	Set<Amenity> amenities
) {
	public Listing toListing(Member member, Address address) {
		Capacity capacity = new Capacity(maxGuests, bedrooms, beds, bathrooms);

		return Listing.builder()
			.name(name)
			.roomType(roomType)
			.description(description)
			.address(address)
			.host(member)
			.capacity(capacity)
			.pricePerNight(pricePerNight)
			.amenities(amenities)
			.images(ListingImage.from(images))
			.build();
	}
}
