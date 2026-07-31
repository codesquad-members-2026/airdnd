package com.airdnd.room;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.springframework.util.StringUtils.hasText;

// 커서 기반 페이지네이션용 불투명 커서 코덱. 현재는 마지막 항목의 id 를 Base64(URL-safe)로 감싼다.
// 내부 표현이 바뀌어도 클라이언트는 nextCursor 를 그대로 되돌려주기만 하면 된다.
public final class Cursors {

    private Cursors() {
    }

    public static String encode(long id) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(Long.toString(id).getBytes(StandardCharsets.UTF_8));
    }

    // 비거나 손상된 커서는 첫 페이지로 취급한다(null 반환).
    public static Long decode(String cursor) {
        if (!hasText(cursor)) {
            return null;
        }
        try {
            return Long.parseLong(new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8));
        } catch (RuntimeException e) {
            return null;
        }
    }
}
