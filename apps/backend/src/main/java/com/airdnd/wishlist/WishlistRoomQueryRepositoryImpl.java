package com.airdnd.wishlist;

import com.airdnd.room.RoomQueryRepositoryImpl;
import com.airdnd.wishlist.dto.WishlistRoomRow;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.airdnd.room.QRoom.room;
import static com.airdnd.room.QRoomImage.roomImage;
import static com.airdnd.wishlist.QWishlistRoom.wishlistRoom;

@RequiredArgsConstructor
public class WishlistRoomQueryRepositoryImpl implements WishlistRoomQueryRepository {

    private final JPAQueryFactory factory;

    @Override
    public List<WishlistRoomRow> findRoomPage(Long wishlistId, Long cursorId, int limit) {
        return factory
                .select(Projections.constructor(WishlistRoomRow.class,
                        wishlistRoom.id,
                        RoomQueryRepositoryImpl.roomSummaryProjection()))
                .from(wishlistRoom)
                .join(wishlistRoom.room, room)
                .where(
                        wishlistRoom.wishlist.id.eq(wishlistId),
                        cursorId == null ? null : wishlistRoom.id.lt(cursorId))
                .orderBy(wishlistRoom.id.desc())
                .limit(limit)
                .fetch();
    }

    @Override
    public Map<Long, String> findCoverImageUrlsByMemberId(Long memberId) {
        // 폴더마다 가장 먼저 담은(=wishlist_rooms.id 가 최소인) 행 한 건씩만 추려,
        // 그 숙소의 대표 이미지 URL 을 표지로 가져온다. 폴더 수만큼이 아니라 단 한 번의 쿼리.
        QWishlistRoom earliest = new QWishlistRoom("earliest");
        List<Tuple> rows = factory
                .select(
                        wishlistRoom.wishlist.id,
                        JPAExpressions.select(roomImage.imageUrl.max())
                                .from(roomImage)
                                .where(roomImage.room.eq(room), roomImage.isRepresentative.isTrue()))
                .from(wishlistRoom)
                .join(wishlistRoom.room, room)
                .where(wishlistRoom.id.in(
                        JPAExpressions.select(earliest.id.min())
                                .from(earliest)
                                .where(earliest.wishlist.memberId.eq(memberId))
                                .groupBy(earliest.wishlist.id)))
                .fetch();

        Map<Long, String> covers = new HashMap<>();
        for (Tuple row : rows) {
            String url = row.get(1, String.class);
            if (url != null && !url.isBlank()) {
                covers.put(row.get(0, Long.class), url);
            }
        }
        return covers;
    }
}
