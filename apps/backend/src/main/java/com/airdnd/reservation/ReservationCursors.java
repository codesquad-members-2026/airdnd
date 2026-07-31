package com.airdnd.reservation;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;

import static org.springframework.util.StringUtils.hasText;

// 게스트 예약 목록용 복합 커서 코덱. 탭마다 정렬 키 날짜가 다르므로(다가오는=checkIn, 지난/취소=checkOut)
// 정렬 날짜와 id 를 함께 (date|id) 로 묶어 Base64(URL-safe)로 감싼다. keyset 페이지네이션의 동점 처리를
// 위해 id 를 2차 정렬 키로 같이 싣는다. 클라이언트는 nextCursor 를 그대로 되돌려주기만 하면 된다.
public final class ReservationCursors {

    private ReservationCursors() {
    }

    public record DateIdCursor(LocalDate date, Long id) {
    }

    public static String encode(LocalDate date, long id) {
        String raw = date + "|" + id;
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    // 비거나 손상된 커서는 첫 페이지로 취급한다(null 반환).
    public static DateIdCursor decode(String cursor) {
        if (!hasText(cursor)) {
            return null;
        }
        try {
            String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            int separator = raw.indexOf('|');
            LocalDate date = LocalDate.parse(raw.substring(0, separator));
            long id = Long.parseLong(raw.substring(separator + 1));
            return new DateIdCursor(date, id);
        } catch (RuntimeException e) {
            return null;
        }
    }
}
