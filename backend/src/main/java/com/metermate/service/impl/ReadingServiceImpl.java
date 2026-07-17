package com.metermate.service.impl;

import com.metermate.dto.ReadingRequest;
import com.metermate.dto.ReadingResponse;
import com.metermate.entity.MonthlyReading;
import com.metermate.entity.Meter;
import com.metermate.entity.Settings;
import com.metermate.exception.BusinessRuleException;
import com.metermate.exception.ResourceNotFoundException;
import com.metermate.repository.MonthlyReadingRepository;
import com.metermate.repository.MeterRepository;
import com.metermate.repository.SettingsRepository;
import com.metermate.service.ReadingService;
import com.metermate.util.BillCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReadingServiceImpl implements ReadingService {

    private static final Logger log = LoggerFactory.getLogger(ReadingServiceImpl.class);

    private final MonthlyReadingRepository readingRepository;
    private final MeterRepository meterRepository;
    private final SettingsRepository settingsRepository;

    public ReadingServiceImpl(MonthlyReadingRepository readingRepository, MeterRepository meterRepository,
                              SettingsRepository settingsRepository) {
        this.readingRepository = readingRepository;
        this.meterRepository = meterRepository;
        this.settingsRepository = settingsRepository;
    }

    @Override
    public ReadingResponse saveMonthlyReading(ReadingRequest request) {
        Meter meter = meterRepository.findById(request.meterId())
                .orElseThrow(() -> new ResourceNotFoundException("Meter not found"));

        // Duplicate month entries not allowed
        if (readingRepository.existsByMeterIdAndMonthAndYear(request.meterId(), request.month(), request.year())) {
            throw new BusinessRuleException("Duplicate monthly reading for meter/month/year");
        }

        // Fetch latest previous reading
        BigDecimal previous = readingRepository.findFirstByMeterIdOrderByYearDescMonthDesc(request.meterId())
                .map(MonthlyReading::getCurrentReading)
                .orElse(BigDecimal.ZERO);

        BigDecimal current = request.currentReading();
        if (current.compareTo(previous) < 0) {
            throw new BusinessRuleException("Current reading cannot be smaller than previous reading");
        }

        Settings settings = settingsRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new BusinessRuleException("Settings not configured"));

        var units = BillCalculator.calculateUnits(current, previous);
        var bill = BillCalculator.calculateBill(units, settings.getRatePerUnit(), settings.getFixedCharge());

        MonthlyReading reading = MonthlyReading.builder()
                .meter(meter)
                .month(request.month())
                .year(request.year())
                .previousReading(previous)
                .currentReading(current)
                .unitsConsumed(units)
                .billAmount(bill)
                .build();

        MonthlyReading saved = readingRepository.save(reading);
        log.info("Saved reading {} for meter {}", saved.getId(), meter.getId());
        return map(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReadingResponse> getAllReadings() {
        return readingRepository.findAll().stream()
                .map(this::map)
                .sorted((a, b) -> b.createdAt().compareTo(a.createdAt()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReadingResponse> getReadingsByMeter(Long meterId) {
        return readingRepository.findByMeterIdOrderByYearDescMonthDesc(meterId).stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    private ReadingResponse map(MonthlyReading r) {
        return ReadingResponse.builder()
                .id(r.getId())
                .meterId(r.getMeter().getId())
                .month(r.getMonth())
                .year(r.getYear())
                .previousReading(r.getPreviousReading())
                .currentReading(r.getCurrentReading())
                .unitsConsumed(r.getUnitsConsumed())
                .billAmount(r.getBillAmount())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
