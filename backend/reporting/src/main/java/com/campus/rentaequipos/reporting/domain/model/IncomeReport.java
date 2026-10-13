package com.campus.rentaequipos.reporting.domain.model;

import java.math.BigDecimal;

public record IncomeReport(
        BigDecimal totalIncome,
        int totalRentals,
        int totalPayments
) {}
