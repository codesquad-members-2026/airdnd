package codesquad.airdnd.domain.wishlist.entity;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import codesquad.airdnd.domain.member.Member;

class WishlistTest {

	@Test
	@DisplayName("updateName 으로 위시리스트 이름을 변경한다")
	void updateName() {
		// given
		Wishlist wishlist = Wishlist.builder()
			.member(Member.builder().nickname("tester").build())
			.name("옛 이름")
			.build();

		// when
		wishlist.updateName("새 이름");

		// then
		assertThat(wishlist.getName()).isEqualTo("새 이름");
	}

	@Test
	@DisplayName("빈 문자열로도 이름을 변경할 수 있다")
	void updateName_toEmpty() {
		// given
		Wishlist wishlist = Wishlist.builder()
			.member(Member.builder().nickname("tester").build())
			.name("옛 이름")
			.build();

		// when
		wishlist.updateName("");

		// then
		assertThat(wishlist.getName()).isEmpty();
	}
}
