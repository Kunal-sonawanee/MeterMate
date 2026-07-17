package com.metermate.config;

import com.metermate.entity.Meter;
import com.metermate.entity.MeterType;
import com.metermate.entity.Property;
import com.metermate.entity.Settings;
import com.metermate.repository.MeterRepository;
import com.metermate.repository.PropertyRepository;
import com.metermate.repository.SettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final PropertyRepository propertyRepository;
    private final MeterRepository meterRepository;
    private final SettingsRepository settingsRepository;

    public DataInitializer(PropertyRepository propertyRepository, MeterRepository meterRepository,
                           SettingsRepository settingsRepository) {
        this.propertyRepository = propertyRepository;
        this.meterRepository = meterRepository;
        this.settingsRepository = settingsRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        // Create default property if none exists
        propertyRepository.findFirstByActiveTrue().orElseGet(() -> {
            Property p = Property.builder()
                    .name("Default Property")
                    .address("Default address")
                    .active(true)
                    .build();
            Property saved = propertyRepository.save(p);

            // Create meters
            Meter main = Meter.builder()
                    .property(saved)
                    .meterName("Main Meter")
                    .meterType(MeterType.MAIN)
                    .active(true)
                    .build();
            meterRepository.save(main);

            meterRepository.save(Meter.builder().property(saved).meterName("Room 1").meterType(MeterType.SUB).build());
            meterRepository.save(Meter.builder().property(saved).meterName("Room 2").meterType(MeterType.SUB).build());
            meterRepository.save(Meter.builder().property(saved).meterName("Room 3").meterType(MeterType.SUB).build());

            log.info("Seeded default property and meters");
            return saved;
        });

        settingsRepository.findFirstByOrderByIdAsc().orElseGet(() -> {
            Settings s = Settings.builder()
                    .ratePerUnit(BigDecimal.valueOf(7.5))
                    .fixedCharge(BigDecimal.ZERO)
                    .build();
            Settings saved = settingsRepository.save(s);
            log.info("Seeded default settings {}", saved.getId());
            return saved;
        });
    }
}
