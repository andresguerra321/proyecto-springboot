package com.campus.rentaequipos.rental.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Cotización del recargo por devolución tardía (días de retraso × tarifa diaria × 1.5). */
public record LateFeeResponse(
        UUID rentalId,
        String rentalCode,
        LocalDate endDate,
        LocalDate evaluatedAt,
        long daysOverdue,
        BigDecimal dailyRateSum,
        BigDecimal penaltyFactor,
        BigDecimal lateFee
) {}
