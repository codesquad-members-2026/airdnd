package com.airdnd.room;

import com.airdnd.room.dto.HostRoomRequest;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long hostId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String region;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(nullable = false, length = 5)
    private String countryCode;

    @Column(nullable = false, precision = 15, scale = 12)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 15, scale = 12)
    private BigDecimal longitude;

    @Column(nullable = false)
    private Integer pricePerNight;

    @Column(nullable = false)
    private Integer maxCapacity;

    @Column(nullable = false)
    private Boolean allowsInfants;

    @Column(nullable = false)
    private Boolean allowsPets;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "room_amenities", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "amenity")
    private List<String> amenities = new ArrayList<>();

    @Column(nullable = false)
    private Boolean isActive;

    @Column(nullable = false)
    private Boolean isDeleted;

    @BatchSize(size = 50)
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoomImage> images = new ArrayList<>();


    @Builder
    private Room(Long hostId, String name, String region, String description, String address,
                 String countryCode, BigDecimal latitude, BigDecimal longitude, Integer pricePerNight,
                 Integer maxCapacity, Boolean allowsInfants, Boolean allowsPets, List<String> amenities) {
        this.hostId = hostId;
        this.name = name;
        this.region = region;
        this.description = description;
        this.address = address;
        this.countryCode = countryCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.pricePerNight = pricePerNight;
        this.maxCapacity = maxCapacity;
        this.allowsInfants = allowsInfants;
        this.allowsPets = allowsPets;
        if (amenities != null) {
            this.amenities.addAll(amenities);
        }
        this.isActive = true;
        this.isDeleted = false;
    }

    public static Room fromRoomRequest(Long hostId, HostRoomRequest request) {
        return Room.builder()
                .hostId(hostId)
                .name(request.getName())
                .region(request.getRegion())
                .description(request.getDescription())
                .address(request.getAddress())
                .countryCode(request.getCountryCode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .pricePerNight(request.getPricePerNight())
                .maxCapacity(request.getMaxGuests())
                .allowsInfants(request.getAllowsInfants())
                .allowsPets(request.getAllowsPets())
                .amenities(request.getAmenities())
                .build();
    }
    public void addRoomImage(RoomImage roomImage) {
        this.images.add(roomImage);
        roomImage.assignRoom(this);
    }

    public String getRepresentativeImageUrl() {
        return getImages().stream().filter(RoomImage::getIsRepresentative).findFirst().
                map(RoomImage::getImageUrl).orElse("");
    }
}
