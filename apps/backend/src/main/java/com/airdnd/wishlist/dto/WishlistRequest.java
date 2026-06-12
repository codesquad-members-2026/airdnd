package com.airdnd.wishlist.dto;

import jakarta.validation.constraints.NotNull;

public record WishlistRequest (
        @NotNull
        String name
){
}
