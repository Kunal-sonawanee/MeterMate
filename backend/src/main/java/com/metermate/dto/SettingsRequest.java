package com.metermate.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Builder;

import java.io.Serializable;
import java.math.BigDecimal;

@Builder
public record SettingsRequest(
        @NotNull @Positive BigDecimal ratePerUnit,
        @NotNull @PositiveOrZero BigDecimal fixedCharge
) implements Serializable {
}
