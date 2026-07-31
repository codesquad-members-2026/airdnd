package com.airdnd.room.dto;

import java.util.List;

// 커서 기반 한 페이지. hasNext=false 면 nextCursor 는 null 이고 더 가져올 항목이 없다.
// totalCount 는 현재 조건(영역+필터)에 매칭되는 전체 수로, 첫 페이지에서만 채워지고 이후 페이지는 null
// ("이 지역에 N곳 — 더 좁혀보세요" 안내용). 매번 COUNT 하지 않으려는 최적화다.
public record CursorPage<T>(
        List<T> items,
        String nextCursor,
        boolean hasNext,
        Long totalCount
) {
}
