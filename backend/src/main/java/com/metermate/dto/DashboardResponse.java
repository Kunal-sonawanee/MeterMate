package com.metermate.dto;

import lombok.Builder;

import java.io.Serializable;
import java.math.BigDecimal;

@Builder
public record DashboardResponse(
        BigDecimal mainMeterUnits,
        BigDecimal tenantUnits,
        BigDecimal ownerUnits,
        BigDecimal totalCollection
) implements Serializable {
}
