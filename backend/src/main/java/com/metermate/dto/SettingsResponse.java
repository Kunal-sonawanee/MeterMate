package com.metermate.dto;

import lombok.Builder;

import java.io.Serializable;
import java.math.BigDecimal;

@Builder
public record SettingsResponse(
        Long id,
        BigDecimal ratePerUnit,
        BigDecimal fixedCharge
) implements Serializable {
}
