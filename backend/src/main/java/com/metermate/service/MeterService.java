package com.metermate.service;

import com.metermate.dto.MeterRequest;
import com.metermate.dto.MeterResponse;

import java.util.List;

public interface MeterService {

    MeterResponse createMeter(MeterRequest request);

    MeterResponse updateMeter(Long id, MeterRequest request);

    void deleteMeter(Long id);

    MeterResponse getMeter(Long id);

    List<MeterResponse> getAllMeters();

    List<MeterResponse> getTenantMeters();
}
