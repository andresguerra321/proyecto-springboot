package com.campus.rentaequipos.billing.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentRequest(
        UUID rentalId,
        BigDecimal amount,
        String paymentMethod
) {}
