package com.campus.rentaequipos.reporting.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

public record ProviderDashboardReport(
        UUID providerId,
        long totalTools,
        long rentedTools,
        long maintenanceTools,
        BigDecimal totalEarnings,
        long pendingRentals,
        long activeRentals
) {}
