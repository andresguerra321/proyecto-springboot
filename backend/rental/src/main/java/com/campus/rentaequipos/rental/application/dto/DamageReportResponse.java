package com.campus.rentaequipos.rental.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record DamageReportResponse(
        UUID id,
        UUID inspectionId,
        UUID toolId,
        String severity,
        String description,
        BigDecimal repairCost,
        boolean isChargedToClient
) {}
