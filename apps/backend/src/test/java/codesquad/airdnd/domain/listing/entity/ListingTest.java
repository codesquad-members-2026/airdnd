package codesquad.airdnd.domain.listing.entity;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.test.util.ReflectionTestUtils;

import codesquad.airdnd.domain.member.Member;

class ListingTest {

	private Member host;
	private Member otherMember;

	@BeforeEach
	void setUp() {
		host = member(1L, "host");
		otherMember = member(2L, "other");
	}

	private Member member(Long id, String nickname) {
		Member member = Member.builder()
			.nickname(nickname)
			.build();
		ReflectionTestUtils.setField(member, "id", id);
		return member;
	}

	@Nested
	@DisplayName("숙소 생성")
	class Creation {

		@Test
		@DisplayName("새로 생성된 숙소의 초기 상태는 PENDING이다")
		void initialStateIsPending() {
			Listing listing = buildListing(host);

			assertThat(listing.getState()).isEqualTo(ListingState.PENDING);
		}
	}

	@Nested
	@DisplayName("이미지 등록")
	class Images {

		@Test
		@DisplayName("이미지와 함께 생성하면 각 이미지의 소속 숙소가 해당 숙소로 설정된다")
		void assignsListingToEachImage() {
			Listing listing = buildListingWithImages(host, List.of("url1", "url2", "url3"));

			assertThat(listing.getImages())
				.allSatisfy(image -> assertThat(image.getListing()).isSameAs(listing));
		}

		@Test
		@DisplayName("이미지의 정렬 순서는 전달된 순서대로 0부터 부여된다")
		void assignsSortOrderByIndex() {
			Listing listing = buildListingWithImages(host, List.of("url1", "url2", "url3"));

			assertThat(listing.getImages())
				.extracting(ListingImage::getSortOrder)
				.containsExactly(0, 1, 2);
		}

		@Test
		@DisplayName("이미지 없이 생성하면 빈 이미지 목록을 가진다")
		void initializesEmptyImagesWhenNull() {
			Listing listing = buildListing(host);

			assertThat(listing.getImages()).isEmpty();
		}
	}

	@Nested
	@DisplayName("소유자 확인 (isOwnedBy)")
	class IsOwnedBy {

		@Test
		@DisplayName("등록한 호스트는 숙소 소유자이다")
		void returnsTrueForOwner() {
			Listing listing = buildListing(host);

			assertThat(listing.isOwnedBy(host)).isTrue();
		}

		@Test
		@DisplayName("다른 멤버는 숙소 소유자가 아니다")
		void returnsFalseForNonOwner() {
			Listing listing = buildListing(host);

			assertThat(listing.isOwnedBy(otherMember)).isFalse();
		}
	}

	@Nested
	@DisplayName("승인 상태 확인 (isApproved)")
	class IsApproved {

		@Test
		@DisplayName("PENDING 상태의 숙소는 승인되지 않은 것으로 판단한다")
		void pendingIsNotApproved() {
			Listing listing = buildListing(host);

			assertThat(listing.isApproved()).isFalse();
		}

		@Test
		@DisplayName("activate 호출 후 숙소는 승인된 것으로 판단한다")
		void approvedAfterActivate() {
			Listing listing = buildListing(host);
			listing.activate();

			assertThat(listing.isApproved()).isTrue();
		}

		@Test
		@DisplayName("deactivate 호출 후 숙소는 승인되지 않은 것으로 판단한다")
		void notApprovedAfterDeactivate() {
			Listing listing = buildListing(host);
			listing.activate();
			listing.deactivate();

			assertThat(listing.isApproved()).isFalse();
		}
	}

	@Nested
	@DisplayName("활성화 (activate)")
	class Activate {

		@Test
		@DisplayName("activate 호출 시 상태가 APPROVED로 변경된다")
		void stateBecomesApproved() {
			Listing listing = buildListing(host);
			listing.activate();

			assertThat(listing.getState()).isEqualTo(ListingState.APPROVED);
		}
	}

	@Nested
	@DisplayName("비활성화 (deactivate)")
	class Deactivate {

		@Test
		@DisplayName("deactivate 호출 시 상태가 INACTIVE로 변경된다")
		void stateBecomesInactive() {
			Listing listing = buildListing(host);
			listing.activate();
			listing.deactivate();

			assertThat(listing.getState()).isEqualTo(ListingState.INACTIVE);
		}

		@Test
		@DisplayName("activate → deactivate → activate 순으로 호출 시 상태가 APPROVED로 변경된다")
		void reactivationChangesStateToApproved() {
			Listing listing = buildListing(host);
			listing.activate();
			listing.deactivate();
			listing.activate();

			assertThat(listing.getState()).isEqualTo(ListingState.APPROVED);
		}
	}

	// ===== helper =====

	private Listing buildListing(Member owner) {
		return Listing.builder()
			.name("테스트 숙소")
			.roomType(RoomType.ENTIRE_PLACE)
			.description("설명")
			.address(new Address("서울 강남구 테헤란로 152", "101호", "06236",
				point(37.5012, 127.0396),
				"11", "11680"))
			.host(owner)
			.capacity(new Capacity(2, 1, 1, 1))
			.pricePerNight(BigDecimal.valueOf(50000))
			.amenities(Set.of())
			.build();
	}

	private Listing buildListingWithImages(Member owner, List<String> imageUrls) {
		return Listing.builder()
			.name("테스트 숙소")
			.roomType(RoomType.ENTIRE_PLACE)
			.description("설명")
			.address(new Address("서울 강남구 테헤란로 152", "101호", "06236",
				point(37.5012, 127.0396),
				"11", "11680"))
			.host(owner)
			.capacity(new Capacity(2, 1, 1, 1))
			.pricePerNight(BigDecimal.valueOf(50000))
			.amenities(Set.of())
			.images(ListingImage.from(imageUrls))
			.build();
	}

	private Point point(double lat, double lng) {
		return new GeometryFactory().createPoint(new Coordinate(lng, lat));
	}
}
