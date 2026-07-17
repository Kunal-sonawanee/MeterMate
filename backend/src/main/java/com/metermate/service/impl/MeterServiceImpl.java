package com.metermate.service.impl;

import com.metermate.dto.MeterRequest;
import com.metermate.dto.MeterResponse;
import com.metermate.entity.Meter;
import com.metermate.entity.MeterType;
import com.metermate.entity.Property;
import com.metermate.exception.BusinessRuleException;
import com.metermate.exception.ResourceNotFoundException;
import com.metermate.repository.MeterRepository;
import com.metermate.repository.MonthlyReadingRepository;
import com.metermate.repository.PropertyRepository;
import com.metermate.service.MeterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class MeterServiceImpl implements MeterService {

    private static final Logger log = LoggerFactory.getLogger(MeterServiceImpl.class);

    private final MeterRepository meterRepository;
    private final PropertyRepository propertyRepository;
    private final MonthlyReadingRepository monthlyReadingRepository;

    public MeterServiceImpl(MeterRepository meterRepository, PropertyRepository propertyRepository,
                            MonthlyReadingRepository monthlyReadingRepository) {
        this.meterRepository = meterRepository;
        this.propertyRepository = propertyRepository;
        this.monthlyReadingRepository = monthlyReadingRepository;
    }

    @Override
    public MeterResponse createMeter(MeterRequest request) {
        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        // Unique meter name inside property
        boolean nameExists = property.getMeters().stream()
                .anyMatch(m -> m.getMeterName().equalsIgnoreCase(request.meterName()));
        if (nameExists) {
            throw new BusinessRuleException("Meter name already exists for this property");
        }

        // Only one MAIN allowed
        if (request.meterType() == MeterType.MAIN) {
            boolean mainExists = property.getMeters().stream()
                    .anyMatch(m -> m.getMeterType() == MeterType.MAIN);
            if (mainExists) {
                throw new BusinessRuleException("Only one MAIN meter allowed per property");
            }
        }

        Meter meter = Meter.builder()
                .property(property)
                .meterName(request.meterName())
                .meterType(request.meterType())
                .tenantName(request.tenantName())
                .phone(request.phone())
                .active(true)
                .build();

        Meter saved = meterRepository.save(meter);
        log.info("Created meter {}", saved.getId());
        return map(saved);
    }

    @Override
    public MeterResponse updateMeter(Long id, MeterRequest request) {
        Meter meter = meterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meter not found"));

        Property property = propertyRepository.findById(request.propertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        // Unique name check excluding this meter
        boolean nameExists = property.getMeters().stream()
                .anyMatch(m -> !Objects.equals(m.getId(), id) && m.getMeterName().equalsIgnoreCase(request.meterName()));
        if (nameExists) {
            throw new BusinessRuleException("Meter name already exists for this property");
        }

        // MAIN meter rule
        if (request.meterType() == MeterType.MAIN) {
            boolean otherMain = property.getMeters().stream()
                    .anyMatch(m -> !Objects.equals(m.getId(), id) && m.getMeterType() == MeterType.MAIN);
            if (otherMain) {
                throw new BusinessRuleException("Only one MAIN meter allowed per property");
            }
        }

        meter.setProperty(property);
        meter.setMeterName(request.meterName());
        meter.setMeterType(request.meterType());
        meter.setTenantName(request.tenantName());
        meter.setPhone(request.phone());

        Meter updated = meterRepository.save(meter);
        return map(updated);
    }

    @Override
    public void deleteMeter(Long id) {
        Meter meter = meterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meter not found"));

        // Cannot delete meter that already contains historical readings
        boolean hasReadings = !monthlyReadingRepository.findByMeterIdOrderByYearDescMonthDesc(id).isEmpty();
        if (hasReadings) {
            throw new BusinessRuleException("Cannot delete meter with existing readings");
        }

        meterRepository.delete(meter);
        log.info("Deleted meter {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public MeterResponse getMeter(Long id) {
        Meter meter = meterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meter not found"));
        return map(meter);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeterResponse> getAllMeters() {
        return meterRepository.findByActiveTrue().stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeterResponse> getTenantMeters() {
        return meterRepository.findByActiveTrueAndMeterType(MeterType.SUB).stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    private MeterResponse map(Meter m) {
        return MeterResponse.builder()
                .id(m.getId())
                .propertyId(m.getProperty().getId())
                .meterName(m.getMeterName())
                .meterType(m.getMeterType())
                .tenantName(m.getTenantName())
                .phone(m.getPhone())
                .active(m.isActive())
                .build();
    }
}
