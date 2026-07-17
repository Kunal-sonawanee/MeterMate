package com.metermate.service;

import com.metermate.dto.ReadingRequest;
import com.metermate.dto.ReadingResponse;

import java.util.List;

public interface ReadingService {

    ReadingResponse saveMonthlyReading(ReadingRequest request);

    List<ReadingResponse> getAllReadings();

    List<ReadingResponse> getReadingsByMeter(Long meterId);

}
