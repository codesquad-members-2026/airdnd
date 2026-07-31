package com.airdnd.room;

import com.airdnd.room.dto.HostRoomRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @InjectMocks
    private RoomService roomService;

    @Mock
    private RoomRepository roomRepository;

    @Test
    @DisplayName("호스트가 유효한 숙소 정보를 등록하면 숙소와 대표 이미지가 성공적으로 저장된다.")
    void registerRoom_Success() {
        // given
        HostRoomRequest request = new HostRoomRequest();
        ReflectionTestUtils.setField(request, "name", "테스트 오션뷰 숙소");
        ReflectionTestUtils.setField(request, "region", "제주");
        ReflectionTestUtils.setField(request, "address", "제주도 서귀포시");
        ReflectionTestUtils.setField(request, "description", "뷰가 아주 좋습니다.");
        ReflectionTestUtils.setField(request, "pricePerNight", 100000);
        ReflectionTestUtils.setField(request, "maxGuests", 4);
        ReflectionTestUtils.setField(request, "imageUrl", "http://example.com/image.jpg");
        ReflectionTestUtils.setField(request, "imageUrls", java.util.Arrays.asList("http://example.com/image2.jpg"));
        ReflectionTestUtils.setField(request, "amenities", java.util.Arrays.asList("와이파이", "주차"));
        ReflectionTestUtils.setField(request, "allowsInfants", true);
        ReflectionTestUtils.setField(request, "allowsPets", false);
        ReflectionTestUtils.setField(request, "countryCode", "KR");
        ReflectionTestUtils.setField(request, "latitude", new BigDecimal("33.2511"));
        ReflectionTestUtils.setField(request, "longitude", new BigDecimal("126.5611"));

        Room savedRoom = Room.builder()
                .hostId(1L)
                .name("테스트 오션뷰 숙소")
                .region("제주")
                .address("제주도 서귀포시")
                .description("뷰가 아주 좋습니다.")
                .pricePerNight(100000)
                .maxCapacity(4)
                .allowsInfants(true)
                .allowsPets(false)
                .countryCode("KR")
                .latitude(new BigDecimal("33.2511"))
                .longitude(new BigDecimal("126.5611"))
                .amenities(java.util.Arrays.asList("와이파이", "주차"))
                .build();
        ReflectionTestUtils.setField(savedRoom, "id", 100L); // 저장된 엔티티의 ID 모킹

        given(roomRepository.save(any(Room.class))).willReturn(savedRoom);

        // when
        Long roomId = roomService.registerRoom(1L, "테스트 호스트", request);

        // then
        assertThat(roomId).isEqualTo(100L);
        verify(roomRepository).save(any(Room.class));
    }
}
