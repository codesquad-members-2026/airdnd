package com.airdnd.room;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.room.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;


    @Transactional
    public Long registerRoom(Long memberId, String hostName ,HostRoomRequest request) {

        Room room = Room.fromRoomRequest(memberId,hostName ,request);

        RoomImage representativeImage = RoomImage.builder()
                .imageUrl(request.getImageUrl())
                .isRepresentative(true)
                .build();

        room.addRoomImage(representativeImage);

        if (request.getImageUrls() != null) {
            for (String additionalImageUrl : request.getImageUrls()) {
                RoomImage additionalImage = RoomImage.builder()
                        .imageUrl(additionalImageUrl)
                        .isRepresentative(false)
                        .build();
                room.addRoomImage(additionalImage);
            }
        }

        Room saveRoom = roomRepository.save(room);

        return saveRoom.getId();
    }

    @Transactional(readOnly = true)
    public List<HostRoomResponse> getRoomsByHostId(Long hostId) {
        return roomRepository.findByHostId(hostId).stream()
                .map(HostRoomResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CursorPage<RoomSummary> getRooms(RoomSearchRequestDto conditions) {
        LocalDateTime now = LocalDateTime.now();
        int size = conditions.resolvedSize();

        // 다음 페이지 존재 여부 판단을 위해 size + 1 개까지 조회한다.
        List<RoomSummary> fetched = roomRepository.findPage(conditions, now);
        boolean hasNext = fetched.size() > size;
        List<RoomSummary> pageRooms = hasNext ? fetched.subList(0, size) : fetched;

        List<Long> roomIds = pageRooms.stream().map(RoomSummary::id).toList();
        Map<Long, RoomRatingDto> ratings =
                roomIds.isEmpty() ? Map.of() : roomRepository.findRatingByRoomIds(roomIds);

        List<RoomSummary> items = RoomSummary.fromList(pageRooms, ratings);
        String nextCursor = hasNext ? Cursors.encode(pageRooms.get(pageRooms.size() - 1).id()) : null;


        Long totalCount = conditions.cursorId() == null ? roomRepository.countInArea(conditions, now) : null;

        return new CursorPage<>(items, nextCursor, hasNext, totalCount);
    }

    @Transactional(readOnly = true)
    public RoomDetailResponse getRoomById(Long id) {

        Room room = roomRepository.findById(id).orElseThrow(()
                -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (!room.getIsActive() || room.getIsDeleted()) {
            throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
        }

        RoomRatingDto rating = roomRepository.findRatingByRoomId(id);
        return RoomDetailResponse.from(room, rating);
    }


    @Transactional
    public RoomDetailResponse updateRoomDetails(Long hostId,Long roomId, RoomUpdateRequest request) {
        Room room = roomRepository.findById(roomId).orElseThrow(()
                -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (!room.getHostId().equals(hostId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
        }
        room.updateRoom(
                request.name(),
                request.description(),
                request.pricePerNight(),
                request.maxGuests(),
                request.allowsInfants(),
                request.allowsPets(),
                request.amenities()
        );

        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            List<RoomImage> newImages = new ArrayList<>();
            for (int i = 0; i < request.imageUrls().size(); i++) {
                RoomImage image = RoomImage.builder()
                        .imageUrl(request.imageUrls().get(i))
                        .isRepresentative(i == 0)
                        .build();
                newImages.add(image);
            }
            room.updateImages(newImages);
        }

        RoomRatingDto rating = roomRepository.findRatingByRoomId(roomId);
        return RoomDetailResponse.from(room, rating);
    }

    @Transactional
    public HostRoomResponse getRoomForUpdateById(Long memberId, Long roomId){
        Room room = roomRepository.findById(roomId).orElseThrow(()-> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        if(!room.getHostId().equals(memberId)){
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
        }
        return HostRoomResponse.from(room);
    }

    @Transactional
    public HostRoomResponse changeRoomStatus(Long hostId, Long roomId, Boolean isActive) {
        Room room = roomRepository.findById(roomId).orElseThrow(()-> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        if(!room.getHostId().equals(hostId)){
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
        }
        room.changeActiveStatus(isActive);
        return HostRoomResponse.from(room);
    }

}
