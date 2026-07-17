package com.metermate.dto;

import com.metermate.entity.MeterType;
import lombok.Builder;

import java.io.Serializable;

@Builder
public record MeterResponse(
        Long id,
        Long propertyId,
        String meterName,
        MeterType meterType,
        String tenantName,
        String phone,
        boolean active
) implements Serializable {
}
