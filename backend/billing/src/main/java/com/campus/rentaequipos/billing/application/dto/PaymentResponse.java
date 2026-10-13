package com.campus.rentaequipos.billing.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        String paymentReference,
        UUID rentalId,
        BigDecimal amount,
        String paymentMethod,
        String paymentStatus,
        LocalDateTime transactionDate
) {}
