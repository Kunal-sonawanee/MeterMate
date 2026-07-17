package com.metermate.repository;

import com.metermate.entity.Meter;
import com.metermate.entity.MeterType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeterRepository extends JpaRepository<Meter, Long> {

    List<Meter> findByPropertyId(Long propertyId);

    List<Meter> findByActiveTrue();

    List<Meter> findByActiveTrueAndMeterType(MeterType meterType);
}
