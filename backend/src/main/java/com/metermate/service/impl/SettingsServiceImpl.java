package com.metermate.service.impl;

import com.metermate.dto.SettingsRequest;
import com.metermate.dto.SettingsResponse;
import com.metermate.entity.Settings;
import com.metermate.exception.ResourceNotFoundException;
import com.metermate.repository.SettingsRepository;
import com.metermate.service.SettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SettingsServiceImpl implements SettingsService {

    private static final Logger log = LoggerFactory.getLogger(SettingsServiceImpl.class);

    private final SettingsRepository settingsRepository;

    public SettingsServiceImpl(SettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public SettingsResponse getSettings() {
        return settingsRepository.findFirstByOrderByIdAsc()
                .map(this::map)
                .orElseThrow(() -> new ResourceNotFoundException("Settings not found"));
    }

    @Override
    public SettingsResponse createOrUpdate(SettingsRequest request) {
        Settings settings = settingsRepository.findFirstByOrderByIdAsc()
                .map(s -> {
                    s.setRatePerUnit(request.ratePerUnit());
                    s.setFixedCharge(request.fixedCharge());
                    return s;
                })
                .orElseGet(() -> Settings.builder()
                        .ratePerUnit(request.ratePerUnit())
                        .fixedCharge(request.fixedCharge())
                        .build());

        Settings saved = settingsRepository.save(settings);
        log.info("Saved settings {}", saved.getId());
        return map(saved);
    }

    private SettingsResponse map(Settings s) {
        return SettingsResponse.builder()
                .id(s.getId())
                .ratePerUnit(s.getRatePerUnit())
                .fixedCharge(s.getFixedCharge())
                .build();
    }
}
