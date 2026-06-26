package codesquad.airdnd.global.response;

import java.util.List;

import org.springframework.data.domain.Page;

public record PageResponse<T>(
	List<T> content,
	int page,             // 현재 페이지
	int size,             // 페이징 크기
	long totalElements,  // 총 데이터 수
	int totalPages,     // 총 페이지 수
	boolean hasNext
) {
	public static <T> PageResponse<T> from(Page<T> page) {
		return new PageResponse<>(
			page.getContent(),
			page.getNumber(),
			page.getSize(),
			page.getTotalElements(),
			page.getTotalPages(),
			page.hasNext()
		);
	}
}
