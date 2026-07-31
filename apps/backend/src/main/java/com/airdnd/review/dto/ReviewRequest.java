package com.airdnd.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewRequest(

        @Min(1)
        @Max(5)
        double rating,

        @NotBlank
        @Size(min = 10, max = 1000)
        String comment
)
{ }
