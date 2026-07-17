package com.metermate.repository;

import com.metermate.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {

    Optional<Property> findFirstByActiveTrue();
}
