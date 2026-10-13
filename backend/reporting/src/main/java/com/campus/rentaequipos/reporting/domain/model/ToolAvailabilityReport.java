package com.campus.rentaequipos.reporting.domain.model;

public record ToolAvailabilityReport(
        long totalTools,
        long availableTools,
        long rentedTools,
        long maintenanceTools,
        long retiredTools
) {}
