package com.campus.rentaequipos.rental.application.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ToolAvailabilityResponse(
        UUID toolId,
        String toolName,
        boolean isAvailable,
        String currentStatus,
        LocalDate queryStartDate,
        LocalDate queryEndDate,
        List<DateRangeDto> bookedDateRanges,
        String message
) {
    public record DateRangeDto(LocalDate startDate, LocalDate endDate) {}
}
