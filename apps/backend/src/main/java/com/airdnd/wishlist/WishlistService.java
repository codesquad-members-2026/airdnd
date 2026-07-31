package com.airdnd.wishlist;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.room.Cursors;
import com.airdnd.room.Room;
import com.airdnd.room.RoomRepository;
import com.airdnd.room.dto.CursorPage;
import com.airdnd.room.dto.RoomRatingDto;
import com.airdnd.room.dto.RoomSummary;
import com.airdnd.user.Member;
import com.airdnd.wishlist.dto.RoomWishlistIdsResponse;
import com.airdnd.wishlist.dto.SavedRoomIdsResponse;
import com.airdnd.wishlist.dto.WishlistListResponse;
import com.airdnd.wishlist.dto.WishlistRequest;
import com.airdnd.wishlist.dto.WishlistResponse;
import com.airdnd.wishlist.dto.WishlistRoomRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final RoomRepository roomRepository;
    private final WishlistRoomRepository wishlistRoomRepository;

    @Transactional
    public Member createDefaultWishlist(Member member) {
        wishlistRepository.save(Wishlist.createDefault(member.getId()));
        return member;
    }

    @Transactional(readOnly = true)
    public WishlistListResponse getAllWishListsByMemberId(Long memberId) {
        List<Wishlist> wishlists = wishlistRepository.findAllWithRoomsByMemberId(memberId);
        // 폴더별 표지(첫 숙소 대표 이미지)는 N+1 없이 한 번의 쿼리로 모아 붙인다.
        Map<Long, String> covers = wishlistRoomRepository.findCoverImageUrlsByMemberId(memberId);
        return WishlistListResponse.of(wishlists, covers);
    }

    // 폴더 메타(이름·담긴 수)만 반환한다. 저장 숙소는 getWishlistRooms 가 커서 페이지로 따로 내려준다.
    // 기존엔 전체 rooms 를 join fetch 로 적재했는데, 그게 상세 페이지 무한 스크롤의 원인이라 분리했다.
    @Transactional(readOnly = true)
    public WishlistResponse getWishListByWishListId(Long memberId, Long wishlistId) {
        Wishlist wishlist = getOwnedWishlist(memberId, wishlistId);
        long roomCount = wishlistRoomRepository.countByWishlistId(wishlistId);
        return WishlistResponse.of(wishlist, roomCount);
    }

    // 폴더에 담긴 숙소를 커서(keyset) 무한 스크롤 페이지로 조회한다.
    // 정렬·커서 키는 wishlist_rooms.id(최근 담은 순). 카드는 목록과 동일한 RoomSummary 를 쓴다.
    @Transactional(readOnly = true)
    public CursorPage<RoomSummary> getWishlistRooms(Long memberId, Long wishlistId, String cursor, int size) {
        getOwnedWishlist(memberId, wishlistId);

        Long cursorId = Cursors.decode(cursor);
        // 다음 페이지 존재 여부 판단을 위해 size + 1 개까지 조회한다.
        List<WishlistRoomRow> fetched = wishlistRoomRepository.findRoomPage(wishlistId, cursorId, size + 1);
        boolean hasNext = fetched.size() > size;
        List<WishlistRoomRow> pageRows = hasNext ? fetched.subList(0, size) : fetched;

        List<Long> roomIds = pageRows.stream().map(row -> row.room().id()).toList();
        Map<Long, RoomRatingDto> ratings =
                roomIds.isEmpty() ? Map.of() : roomRepository.findRatingByRoomIds(roomIds);

        List<RoomSummary> items = pageRows.stream()
                .map(row -> row.room().withRating(ratings.get(row.room().id())))
                .toList();
        String nextCursor = hasNext
                ? Cursors.encode(pageRows.get(pageRows.size() - 1).wishlistRoomId())
                : null;

        return new CursorPage<>(items, nextCursor, hasNext, null);
    }

    // 폴더를 불러오고 소유권을 검증한다(남의 폴더면 차단). 폴더별 토글 메서드와 동일한 규칙.
    private Wishlist getOwnedWishlist(Long memberId, Long wishlistId) {
        Wishlist wishlist = wishlistRepository.findById(wishlistId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));
        if (!wishlist.getMemberId().equals(memberId)) {
            throw new BusinessException(ErrorCode.WISHLIST_BELONG_TO_OTHERS);
        }
        return wishlist;
    }

    @Transactional
    public void createNewWishlist(Long memberId, WishlistRequest request){
        if(wishlistRepository.existsWishlistByMemberIdAndNameIgnoreCase(memberId, request.name())){
            throw new BusinessException(ErrorCode.WISHLIST_ALREADY_EXISTS);
        }
        wishlistRepository.save(Wishlist.create(memberId,request.name()));
    }

    @Transactional
    public void addRoomToWishlist(Long memberId, Long wishlistId ,Long roomId){
        Wishlist targetWishlist = getOwnedWishlist(memberId, wishlistId);
        Room targetRoom = roomRepository.findById(roomId).orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        if(targetWishlist.getRooms().stream().anyMatch(wlr -> wlr.getRoom().getId().equals(roomId))){
            throw new BusinessException(ErrorCode.WISHLIST_ROOM_ALREADY_EXISTS);
        }
        targetWishlist.addRoom(targetRoom);
        wishlistRepository.save(targetWishlist);
    }

    @Transactional(readOnly = true)
    public SavedRoomIdsResponse getSavedRoomIds(Long memberId) {
        return new SavedRoomIdsResponse(wishlistRoomRepository.findRoomIdsByMemberId(memberId));
    }

    @Transactional
    public void removeRoomFromWishlists(Long memberId, Long roomId) {
        wishlistRoomRepository.deleteByRoomIdAndMemberId(roomId, memberId);
    }

    @Transactional(readOnly = true)
    public RoomWishlistIdsResponse getWishlistIdsForRoom(Long memberId, Long roomId) {
        return new RoomWishlistIdsResponse(wishlistRoomRepository.findWishlistIdsByRoomIdAndMemberId(roomId, memberId));
    }

    @Transactional
    public void removeRoomFromFolder(Long memberId, Long wishlistId, Long roomId) {
        getOwnedWishlist(memberId, wishlistId);
        // 멱등: 해당 폴더에 그 방이 없으면 0건 삭제.
        wishlistRoomRepository.deleteByWishlistIdAndRoomId(wishlistId, roomId);
    }
}
