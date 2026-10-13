package com.campus.rentaequipos.billing.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record InvoiceResponse(
        UUID id,
        String invoiceNumber,
        UUID rentalId,
        UUID paymentId,
        LocalDateTime issueDate,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalBilled,
        String pdfUrl
) {}
