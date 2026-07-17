package com.metermate.dto;

import lombok.Builder;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

@Builder
public record ReadingResponse(
        Long id,
        Long meterId,
        Integer month,
        Integer year,
        BigDecimal previousReading,
        BigDecimal currentReading,
        BigDecimal unitsConsumed,
        BigDecimal billAmount,
        Instant createdAt
) implements Serializable {
}
