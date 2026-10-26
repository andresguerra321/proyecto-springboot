package com.campus.rentaequipos.reporting.domain.model;

import java.math.BigDecimal;

/** Siniestralidad agregada por categoría de herramienta. */
public record DamageSummaryReport(
        String categoryName,
        long totalDamages,
        long totalLossCount,
        BigDecimal totalRepairCost,
        BigDecimal chargedToClients
) {}
