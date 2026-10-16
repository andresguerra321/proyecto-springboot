package com.campus.rentaequipos.rental.application.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ToolAvailabilityResponse(
        UUID toolId,
        String toolName,
        boolean isAvailable,
        String currentStatus,
        int totalStock,
        int availableStock,
        int reservedStock,
        List<UUID> availableToolIds,
        LocalDate queryStartDate,
        LocalDate queryEndDate,
        List<DateRangeDto> bookedDateRanges,
        String message
) {
    public ToolAvailabilityResponse(
            UUID toolId,
            String toolName,
            boolean isAvailable,
            String currentStatus,
            LocalDate queryStartDate,
            LocalDate queryEndDate,
            List<DateRangeDto> bookedDateRanges,
            String message
    ) {
        this(
                toolId,
                toolName,
                isAvailable,
                currentStatus,
                1,
                isAvailable ? 1 : 0,
                isAvailable ? 0 : 1,
                isAvailable ? List.of(toolId) : List.of(),
                queryStartDate,
                queryEndDate,
                bookedDateRanges,
                message
        );
    }

    public record DateRangeDto(LocalDate startDate, LocalDate endDate) {}
}
