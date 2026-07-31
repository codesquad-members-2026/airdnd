package com.airdnd.room.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

// 목록(GET /api/rooms) 카드 한 장의 슬림 응답. 전체 Room 엔티티를 적재하지 않고
// QueryDSL Projections.constructor 로 필요한 컬럼만 직접 채우기 위한 투영 DTO다.
// (대표 이미지 URL 은 room_images 상관 서브쿼리로 가져와, 지연 로딩 images 컬렉션을 건드리지 않는다.)
//
// 평점/후기 수는 findRatingByRoomIds 로 따로 모아 서비스에서 withRating(...) 으로 합친다.
// 응답 DTO 이므로 검증 애너테이션은 없다. JSON 키는 기존 RoomResponse 와 동일하게 맞춰
// 프론트 계약(roomSummarySchema, averageRating→rating 변환)을 깨지 않는다.
public record RoomSummary(
        Long id,
        String name,
        String region,
        String address,
        Integer pricePerNight,
        Integer maxGuests,
        String imageUrl,
        BigDecimal latitude,
        BigDecimal longitude,
        boolean isAvailable,
        boolean allowsPets,
        Double averageRating,
        Long reviewCount
) {
    // imageUrl 은 절대 null 이 되지 않게 정규화한다. 대표 이미지 서브쿼리가 매칭이 없으면
    // null 을 돌려주는데, 프론트 계약(roomSummarySchema 의 url|"")은 null 을 거부하므로 "" 로 바꾼다.
    public RoomSummary {
        if (imageUrl == null) {
            imageUrl = "";
        }
    }

    // QueryDSL Projections.constructor(RoomSummary.class, ...) 1차 투영용 생성자.
    // 평점을 제외한 컬럼만 채운다. 투영 시 인자 순서는 이 순서와 정확히 일치해야 한다:
    //   id, name, region, address, pricePerNight, maxCapacity,
    //   <대표 이미지 URL 서브쿼리>, latitude, longitude, isActive, allowsPets
    // 평점 미부착 기본값은 RoomResponse 와 동일하게 averageRating=null, reviewCount=0 으로 둔다.
    public RoomSummary(
            Long id,
            String name,
            String region,
            String address,
            Integer pricePerNight,
            Integer maxGuests,
            String imageUrl,
            BigDecimal latitude,
            BigDecimal longitude,
            boolean isAvailable,
            boolean allowsPets
    ) {
        this(id, name, region, address, pricePerNight, maxGuests, imageUrl,
                latitude, longitude, isAvailable, allowsPets, null, 0L);
    }

    // 별도로 조회한 평점 집계를 붙여 새 인스턴스를 만든다(record 는 불변이므로 새 객체 반환).
    // rating 이 없으면(후기 없음) 평점 미부착 상태를 그대로 유지한다.
    public RoomSummary withRating(RoomRatingDto rating) {
        if (rating == null) {
            return this;
        }
        return new RoomSummary(id, name, region, address, pricePerNight, maxGuests,
                imageUrl, latitude, longitude, isAvailable, allowsPets,
                rating.averageRating(), rating.reviewCount());
    }

    public static List<RoomSummary> fromList(List<RoomSummary> summaryList, Map<Long,RoomRatingDto> ratings){
        return summaryList.stream().map(r -> r.withRating(ratings.get(r.id))).toList();
    }
}
