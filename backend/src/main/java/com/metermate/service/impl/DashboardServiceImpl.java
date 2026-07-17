package com.metermate.service.impl;

import com.metermate.dto.DashboardResponse;
import com.metermate.entity.Meter;
import com.metermate.entity.MeterType;
import com.metermate.entity.MonthlyReading;
import com.metermate.repository.MeterRepository;
import com.metermate.repository.MonthlyReadingRepository;
import com.metermate.service.DashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardServiceImpl.class);

    private final MeterRepository meterRepository;
    private final MonthlyReadingRepository readingRepository;

    public DashboardServiceImpl(MeterRepository meterRepository, MonthlyReadingRepository readingRepository) {
        this.meterRepository = meterRepository;
        this.readingRepository = readingRepository;
    }

    @Override
    public DashboardResponse getDashboard() {
        List<Meter> meters = meterRepository.findByActiveTrue();

        // Find main meter
        Meter main = meters.stream().filter(m -> m.getMeterType() == MeterType.MAIN).findFirst().orElse(null);

        BigDecimal mainUnits = BigDecimal.ZERO;
        BigDecimal tenantUnits = BigDecimal.ZERO;
        BigDecimal totalCollection = BigDecimal.ZERO;

        if (main != null) {
            mainUnits = readingRepository.findFirstByMeterIdOrderByYearDescMonthDesc(main.getId())
                    .map(MonthlyReading::getUnitsConsumed).orElse(BigDecimal.ZERO);
        }

        for (Meter m : meters) {
            if (m.getMeterType() == MeterType.SUB) {
                BigDecimal u = readingRepository.findFirstByMeterIdOrderByYearDescMonthDesc(m.getId())
                        .map(MonthlyReading::getUnitsConsumed).orElse(BigDecimal.ZERO);
                tenantUnits = tenantUnits.add(u);
            }

            BigDecimal bill = readingRepository.findFirstByMeterIdOrderByYearDescMonthDesc(m.getId())
                    .map(MonthlyReading::getBillAmount).orElse(BigDecimal.ZERO);
            totalCollection = totalCollection.add(bill);
        }

        BigDecimal ownerUnits = mainUnits.subtract(tenantUnits);

        return DashboardResponse.builder()
                .mainMeterUnits(mainUnits)
                .tenantUnits(tenantUnits)
                .ownerUnits(ownerUnits)
                .totalCollection(totalCollection)
                .build();
    }
}
