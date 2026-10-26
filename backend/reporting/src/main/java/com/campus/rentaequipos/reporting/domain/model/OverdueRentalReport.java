package com.campus.rentaequipos.reporting.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Alquiler EN CURSO cuya fecha fin ya pasó. */
public record OverdueRentalReport(
        UUID rentalId,
        String rentalCode,
        String clientName,
        String clientPhone,
        LocalDate endDate,
        int daysOverdue,
        BigDecimal estimatedPenalty
) {}
