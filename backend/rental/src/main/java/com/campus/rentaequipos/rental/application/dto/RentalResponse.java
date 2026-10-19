package com.campus.rentaequipos.rental.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record RentalResponse(
        UUID id,
        String rentalCode,
        UUID clientId,
        LocalDate startDate,
        LocalDate endDate,
        int totalDays,
        BigDecimal subtotal,
        BigDecimal deposit,
        BigDecimal totalAmount,
        String status,
        List<RentalItemResponse> items,
        String deliveryAddress,
        String contactPhone
) {
    public RentalResponse(UUID id, String rentalCode, UUID clientId, LocalDate startDate, LocalDate endDate,
                          int totalDays, BigDecimal subtotal, BigDecimal deposit, BigDecimal totalAmount,
                          String status, List<RentalItemResponse> items) {
        this(id, rentalCode, clientId, startDate, endDate, totalDays, subtotal, deposit, totalAmount, status, items, null, null);
    }

    public record RentalItemResponse(
            UUID id,
            UUID toolId,
            BigDecimal dailyPrice,
            BigDecimal totalPrice,
            String status
    ) {}
}
