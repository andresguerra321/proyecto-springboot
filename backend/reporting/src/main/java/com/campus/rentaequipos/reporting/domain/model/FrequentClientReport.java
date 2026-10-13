package com.campus.rentaequipos.reporting.domain.model;

import java.util.UUID;

public record FrequentClientReport(
        UUID clientId,
        String clientEmail,
        long totalRentals
) {}
