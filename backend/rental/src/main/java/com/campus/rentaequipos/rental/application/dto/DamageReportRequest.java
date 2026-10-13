package com.campus.rentaequipos.rental.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record DamageReportRequest(
        UUID inspectionId,
        UUID toolId,
        String severity, // MINOR, MODERATE, SEVERE, TOTAL_LOSS
        String description,
        BigDecimal repairCost,
        boolean isChargedToClient
) {}
