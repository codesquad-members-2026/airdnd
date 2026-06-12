package com.airdnd.wishlist;

import com.airdnd.room.Room;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(name = "wishlist_rooms")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WishlistRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wishlist_id", nullable = false)
    private Wishlist wishlist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public WishlistRoom(Wishlist wishlist, Room room){
        this.wishlist = wishlist;
        this.room = room;
    }

}
