package com.campus.rentaequipos.reporting.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

public record IncomeReport(
        BigDecimal totalIncome,
        int totalRentals,
        int totalPayments
) {}
