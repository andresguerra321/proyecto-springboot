package com.campus.rentaequipos.rental.application.dto;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record ProviderRentalSummaryResponse(
        UUID providerId,
        long totalRentals,
        Map<String, Long> countByStatus,
        BigDecimal totalCompletedIncome
) {}
