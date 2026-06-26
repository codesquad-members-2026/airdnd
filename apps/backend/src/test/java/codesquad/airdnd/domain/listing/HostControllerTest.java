package codesquad.airdnd.domain.listing;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import codesquad.airdnd.domain.listing.dto.request.ListingCreateRequest;
import codesquad.airdnd.domain.listing.dto.response.HostListingSummary;
import codesquad.airdnd.domain.listing.dto.response.HostListingsList;
import codesquad.airdnd.domain.listing.entity.Amenity;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.domain.listing.entity.ListingState;
import codesquad.airdnd.domain.listing.entity.RoomType;
import codesquad.airdnd.global.auth.AuthUtils;
import codesquad.airdnd.global.auth.LoginArgumentResolver;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;

@WebMvcTest(HostController.class)
@Import(LoginArgumentResolver.class)
class HostControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@MockitoBean
	private ListingService listingService;

	@MockitoBean
	private AuthUtils authUtils;

	// ===== POST /api/host/listings =====

	@Test
	@DisplayName("유효한 요청으로 숙소를 등록하면 200 응답과 success=true를 반환한다")
	void createListing_success() throws Exception {
		willDoNothing().given(listingService).submitListing(anyLong(), any(ListingCreateRequest.class));

		mockMvc.perform(post("/api/host/listings")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(validCreateRequest())))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true));
	}

	@Test
	@DisplayName("name이 빈 문자열이면 400 응답과 COMMON_002 코드를 반환한다")
	void createListing_failsWhenNameIsBlank() throws Exception {
		ListingCreateRequest request = new ListingCreateRequest(
			"", "서울 강남구 테헤란로 152", "101호", "06236",
			37.5012, 127.0396,
			RoomType.ENTIRE_PLACE, 2, 1, 1, 1, fiveImages(), "설명",
			BigDecimal.valueOf(50000), Set.of()
		);

		mockMvc.perform(post("/api/host/listings")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.code").value("COMMON_002"));
	}

	@Test
	@DisplayName("roomType이 null이면 400 응답을 반환한다")
	void createListing_failsWhenRoomTypeIsNull() throws Exception {
		ListingCreateRequest request = new ListingCreateRequest(
			"테스트 숙소", "서울 강남구 테헤란로 152", "101호", "06236",
			37.5012, 127.0396,
			null, 2, 1, 1, 1, fiveImages(), "설명",
			BigDecimal.valueOf(50000), Set.of()
		);

		mockMvc.perform(post("/api/host/listings")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	@DisplayName("pricePerNight가 음수이면 400 응답을 반환한다")
	void createListing_failsWhenPriceIsNegative() throws Exception {
		ListingCreateRequest request = new ListingCreateRequest(
			"테스트 숙소", "서울 강남구 테헤란로 152", "101호", "06236",
			37.5012, 127.0396,
			RoomType.ENTIRE_PLACE, 2, 1, 1, 1, fiveImages(), "설명",
			BigDecimal.valueOf(-1), Set.of()
		);

		mockMvc.perform(post("/api/host/listings")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	@DisplayName("maxGuests가 0이면 400 응답을 반환한다")
	void createListing_failsWhenMaxGuestsIsZero() throws Exception {
		ListingCreateRequest request = new ListingCreateRequest(
			"테스트 숙소", "서울 강남구 테헤란로 152", "101호", "06236",
			37.5012, 127.0396,
			RoomType.ENTIRE_PLACE, 0, 1, 1, 1, fiveImages(), "설명",
			BigDecimal.valueOf(50000), Set.of()
		);

		mockMvc.perform(post("/api/host/listings")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.success").value(false));
	}

	// ===== GET /api/host/listings =====

	@Test
	@DisplayName("호스트의 숙소 목록을 조회하면 200 응답과 숙소 목록을 반환한다")
	void getHostListings_success() throws Exception {
		HostListingsList response = new HostListingsList(List.of(
			new HostListingSummary(1L, "테스트 숙소", RoomType.ENTIRE_PLACE, "강남구, 서울",
				new Capacity(2, 1, 1, 1), BigDecimal.valueOf(50000), ListingState.APPROVED, "cover.jpg")
		));
		given(listingService.getHostListings(anyLong())).willReturn(response);

		mockMvc.perform(get("/api/host/listings"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true))
			.andExpect(jsonPath("$.data.listings").isArray())
			.andExpect(jsonPath("$.data.listings[0].id").value(1L))
			.andExpect(jsonPath("$.data.listings[0].name").value("테스트 숙소"))
			.andExpect(jsonPath("$.data.listings[0].state").value("APPROVED"));
	}

	@Test
	@DisplayName("등록된 숙소가 없는 호스트 조회 시 빈 목록을 반환한다")
	void getHostListings_returnsEmptyList() throws Exception {
		given(listingService.getHostListings(anyLong())).willReturn(new HostListingsList(List.of()));

		mockMvc.perform(get("/api/host/listings"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true))
			.andExpect(jsonPath("$.data.listings").isEmpty());
	}

	// ===== PATCH /api/host/listings/{listingsId}/activate =====

	@Test
	@DisplayName("승인된 본인 숙소를 활성화하면 200 응답과 success=true를 반환한다")
	void activateListing_success() throws Exception {
		willDoNothing().given(listingService).activate(anyLong(), eq(1L));

		mockMvc.perform(patch("/api/host/listings/1/activate"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true));
	}

	@Test
	@DisplayName("본인 소유가 아닌 숙소 활성화 시 403 응답과 LISTING_002 코드를 반환한다")
	void activateListing_failsWhenNotOwner() throws Exception {
		willThrow(new BusinessException(ErrorCode.NOT_LISTING_OWNER))
			.given(listingService).activate(anyLong(), eq(1L));

		mockMvc.perform(patch("/api/host/listings/1/activate"))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.code").value("LISTING_002"));
	}

	@Test
	@DisplayName("승인되지 않은 숙소 활성화 시 409 응답과 LISTING_003 코드를 반환한다")
	void activateListing_failsWhenNotApproved() throws Exception {
		willThrow(new BusinessException(ErrorCode.LISTING_NOT_APPROVED))
			.given(listingService).activate(anyLong(), eq(1L));

		mockMvc.perform(patch("/api/host/listings/1/activate"))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.code").value("LISTING_003"));
	}

	// ===== PATCH /api/host/listings/{listingsId}/deactivate =====

	@Test
	@DisplayName("승인된 본인 숙소를 비활성화하면 200 응답과 success=true를 반환한다")
	void deactivateListing_success() throws Exception {
		willDoNothing().given(listingService).deactivate(anyLong(), eq(1L));

		mockMvc.perform(patch("/api/host/listings/1/deactivate"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true));
	}

	@Test
	@DisplayName("본인 소유가 아닌 숙소 비활성화 시 403 응답과 LISTING_002 코드를 반환한다")
	void deactivateListing_failsWhenNotOwner() throws Exception {
		willThrow(new BusinessException(ErrorCode.NOT_LISTING_OWNER))
			.given(listingService).deactivate(anyLong(), eq(1L));

		mockMvc.perform(patch("/api/host/listings/1/deactivate"))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.code").value("LISTING_002"));
	}

	@Test
	@DisplayName("승인되지 않은 숙소 비활성화 시 409 응답과 LISTING_003 코드를 반환한다")
	void deactivateListing_failsWhenNotApproved() throws Exception {
		willThrow(new BusinessException(ErrorCode.LISTING_NOT_APPROVED))
			.given(listingService).deactivate(anyLong(), eq(1L));

		mockMvc.perform(patch("/api/host/listings/1/deactivate"))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.code").value("LISTING_003"));
	}

	// ===== helper =====

	private ListingCreateRequest validCreateRequest() {
		return new ListingCreateRequest(
			"테스트 숙소", "서울 강남구 테헤란로 152", "101호", "06236",
			37.5012, 127.0396,
			RoomType.ENTIRE_PLACE, 2, 1, 1, 1, fiveImages(), "멋진 숙소입니다",
			BigDecimal.valueOf(50000), Set.of(Amenity.WIFI)
		);
	}

	private List<String> fiveImages() {
		return List.of("img1.jpg", "img2.jpg", "img3.jpg", "img4.jpg", "img5.jpg");
	}
}
