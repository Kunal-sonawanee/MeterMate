package com.metermate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
        name = "monthly_readings",
    uniqueConstraints = @UniqueConstraint(name = "uk_meter_month_year", columnNames = {"meter_id", "reading_month", "reading_year"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meter_id", nullable = false)
    private Meter meter;

    @NotNull
    @Min(1)
    @Max(12)
    @Column(name = "reading_month", nullable = false)
    private Integer month;

    @NotNull
    @Column(name = "reading_year", nullable = false)
    private Integer year;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal previousReading;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal currentReading;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitsConsumed;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal billAmount;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
