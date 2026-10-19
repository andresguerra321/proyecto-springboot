package com.campus.rentaequipos.rental.application.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record RentalRequest(
        UUID clientId,
        LocalDate startDate,
        LocalDate endDate,
        List<UUID> toolIds,
        String deliveryAddress,
        String contactPhone
) {
    public RentalRequest(UUID clientId, LocalDate startDate, LocalDate endDate, List<UUID> toolIds) {
        this(clientId, startDate, endDate, toolIds, null, null);
    }
}
