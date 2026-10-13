package com.campus.rentaequipos.reporting.domain.model;

import java.util.UUID;

public record MostRentedToolReport(
        UUID toolId,
        String toolName,
        long timesRented
) {}
