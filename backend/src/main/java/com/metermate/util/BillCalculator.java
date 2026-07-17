package com.metermate.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class BillCalculator {

    private static final Logger log = LoggerFactory.getLogger(BillCalculator.class);

    private BillCalculator() {}

    public static BigDecimal calculateUnits(BigDecimal current, BigDecimal previous) {
        if (current == null || previous == null) {
            throw new IllegalArgumentException("Readings must not be null");
        }
        BigDecimal units = current.subtract(previous);
        return units.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateBill(BigDecimal units, BigDecimal ratePerUnit, BigDecimal fixedCharge) {
        if (units == null || ratePerUnit == null || fixedCharge == null) {
            throw new IllegalArgumentException("Billing inputs must not be null");
        }
        BigDecimal amount = units.multiply(ratePerUnit).add(fixedCharge);
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}
