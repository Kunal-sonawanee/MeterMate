package com.metermate.dto;

import com.metermate.entity.MeterType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.io.Serializable;

@Builder
public record MeterRequest(
        @NotNull Long propertyId,
        @NotBlank @Size(max = 150) String meterName,
        @NotNull MeterType meterType,
        @Size(max = 150) String tenantName,
        @Size(max = 20) String phone
) implements Serializable {
}
