package com.metermate.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.io.Serializable;
import java.math.BigDecimal;

@Builder
public record ReadingRequest(
        @NotNull Long meterId,
        @NotNull @Min(1) Integer month,
        @NotNull Integer year,
        @NotNull BigDecimal currentReading
) implements Serializable {
}
