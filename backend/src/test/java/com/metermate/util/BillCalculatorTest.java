package com.metermate.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class BillCalculatorTest {

    @Test
    void calculatesUnitsAndBill() {
        BigDecimal previous = BigDecimal.valueOf(100);
        BigDecimal current = BigDecimal.valueOf(150.5);
        BigDecimal units = BillCalculator.calculateUnits(current, previous);
        assertEquals(0, units.compareTo(BigDecimal.valueOf(50.50).setScale(2)));

        BigDecimal rate = BigDecimal.valueOf(7.5);
        BigDecimal fixed = BigDecimal.ZERO;
        BigDecimal bill = BillCalculator.calculateBill(units, rate, fixed);
        assertEquals(0, bill.compareTo(BigDecimal.valueOf(378.75).setScale(2)));
    }
}
