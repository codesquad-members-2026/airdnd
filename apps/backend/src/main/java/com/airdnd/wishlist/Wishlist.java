package com.airdnd.wishlist;

import com.airdnd.room.Room;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Table(name = "wishlists")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Wishlist {

    // 회원가입 직후 자동 생성되는 기본 위시리스트 폴더 이름
    public static final String DEFAULT_WISHLIST_NAME = "가고 싶은 곳";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long memberId;

    @NotNull
    private String name;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "wishlist", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<WishlistRoom> rooms = new ArrayList<>();

    private Wishlist(Long memberId, String name) {
        this.memberId = memberId;
        this.name = name;
    }

    public static Wishlist createDefault(Long memberId) {
        return new Wishlist(memberId, DEFAULT_WISHLIST_NAME);
    }

    public static Wishlist create(Long memberId, String name){ return new Wishlist(memberId, name);};

    public void addRoom(Room room){
        WishlistRoom newRoomInWishlist = new WishlistRoom(this, room);
        this.rooms.add(newRoomInWishlist);
    }
}
