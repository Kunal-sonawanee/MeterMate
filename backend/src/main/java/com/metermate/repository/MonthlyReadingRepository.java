package com.metermate.repository;

import com.metermate.entity.MonthlyReading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MonthlyReadingRepository extends JpaRepository<MonthlyReading, Long> {

    boolean existsByMeterIdAndMonthAndYear(Long meterId, Integer month, Integer year);

    Optional<MonthlyReading> findFirstByMeterIdOrderByYearDescMonthDesc(Long meterId);

    List<MonthlyReading> findByMeterIdOrderByYearDescMonthDesc(Long meterId);
}
