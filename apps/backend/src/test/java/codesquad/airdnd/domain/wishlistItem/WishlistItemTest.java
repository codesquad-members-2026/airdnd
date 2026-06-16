package codesquad.airdnd.domain.wishlistItem;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.wishlist.entity.Wishlist;

class WishlistItemTest {

	@Test
	@DisplayName("updateNote 로 메모를 변경한다")
	void updateNote() {
		// given
		WishlistItem item = WishlistItem.builder()
			.wishlist(wishlist())
			.note("옛 메모")
			.build();

		// when
		item.updateNote("새 메모");

		// then
		assertThat(item.getNote()).isEqualTo("새 메모");
	}

	@Test
	@DisplayName("빈 문자열로도 메모를 변경할 수 있다")
	void updateNote_toEmpty() {
		// given
		WishlistItem item = WishlistItem.builder()
			.wishlist(wishlist())
			.note("옛 메모")
			.build();

		// when
		item.updateNote("");

		// then
		assertThat(item.getNote()).isEmpty();
	}

	private Wishlist wishlist() {
		return Wishlist.builder()
			.member(Member.builder().nickname("tester").build())
			.name("위시리스트")
			.build();
	}
}
