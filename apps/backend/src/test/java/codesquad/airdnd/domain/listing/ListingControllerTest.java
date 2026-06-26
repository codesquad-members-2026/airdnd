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
import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.util.ReflectionTestUtils;
import codesquad.airdnd.domain.member.Member;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import codesquad.airdnd.domain.listing.dto.response.HostInfo;
import codesquad.airdnd.domain.listing.dto.response.ListingDetailResponse;
import codesquad.airdnd.domain.listing.dto.response.ReviewSummary;
import codesquad.airdnd.domain.listing.entity.Capacity;
import codesquad.airdnd.global.auth.AuthUtils;
import codesquad.airdnd.global.auth.LoginArgumentResolver;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;

@WebMvcTest(ListingController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(LoginArgumentResolver.class)
class ListingControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private ListingSearchService listingSearchService;

	@MockitoBean
	private AuthUtils authUtils;

	@BeforeEach
	void setUpCurrentMember() {
		Member member = Member.builder().nickname("guest").build();
		ReflectionTestUtils.setField(member, "id", 1L);
		given(authUtils.getCurrentMember()).willReturn(member);
	}

	// ===== GET /api/listings/{listingsId} =====

	@Test
	@DisplayName("숙소 상세 조회 시 200 응답과 상세 정보를 반환한다")
	void getListingDetail_success() throws Exception {
		ListingDetailResponse detail = new ListingDetailResponse(
			1L, "테스트 숙소", "멋진 숙소",
			List.of("img1", "img2"),
			37.5012, 127.0396, "강남구, 서울",
			BigDecimal.valueOf(50000),
			new Capacity(2, 1, 1, 1), Set.of(),
			new ReviewSummary(0, null),
			new HostInfo(1L, "testHost", "profile.png"),
			7L
		);
		given(listingSearchService.getListingDetail(anyLong(), eq(1L))).willReturn(detail);

		mockMvc.perform(get("/api/listings/1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true))
			.andExpect(jsonPath("$.data.listingId").value(1L))
			.andExpect(jsonPath("$.data.location").value("강남구, 서울"))
			.andExpect(jsonPath("$.data.host.name").value("testHost"))
			.andExpect(jsonPath("$.data.wishlistId").value(7L));
	}

	@Test
	@DisplayName("비로그인(익명)이어도 숙소 상세를 200으로 조회할 수 있다")
	void getListingDetail_allowsAnonymous() throws Exception {
		// given - 익명: 리졸버가 호출하는 getCurrentMember()가 MEMBER_NOT_FOUND를 던지는 상황
		given(authUtils.getCurrentMember()).willThrow(new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
		ListingDetailResponse detail = new ListingDetailResponse(
			1L, "테스트 숙소", "멋진 숙소",
			List.of("img1"),
			37.5012, 127.0396, "강남구, 서울",
			BigDecimal.valueOf(50000),
			new Capacity(2, 1, 1, 1), Set.of(),
			new ReviewSummary(0, null),
			new HostInfo(1L, "testHost", "profile.png"),
			null // 비로그인 → wishlistId 없음
		);
		// 익명이면 guestId=null 로 호출됨
		given(listingSearchService.getListingDetail(isNull(), eq(1L))).willReturn(detail);

		mockMvc.perform(get("/api/listings/1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true))
			.andExpect(jsonPath("$.data.listingId").value(1L));
	}

	@Test
	@DisplayName("존재하지 않는 숙소 상세 조회 시 404 응답과 LISTING_001 코드를 반환한다")
	void getListingDetail_failsWhenNotFound() throws Exception {
		willThrow(new BusinessException(ErrorCode.LISTING_NOT_FOUND))
			.given(listingSearchService).getListingDetail(anyLong(), eq(99L));

		mockMvc.perform(get("/api/listings/99"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.code").value("LISTING_001"));
	}
}
