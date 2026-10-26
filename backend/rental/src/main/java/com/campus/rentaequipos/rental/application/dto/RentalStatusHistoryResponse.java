package com.campus.rentaequipos.rental.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record RentalStatusHistoryResponse(
        UUID id,
        UUID rentalId,
        String fromStatus,
        String toStatus,
        String changedBy,
        LocalDateTime changedAt,
        String notes
) {
    public static RentalStatusHistoryResponse fromDomain(com.campus.rentaequipos.rental.domain.model.RentalStatusHistory domain) {
        return new RentalStatusHistoryResponse(
                domain.getId(),
                domain.getRentalId(),
                domain.getFromStatus(),
                domain.getToStatus(),
                domain.getChangedBy(),
                domain.getChangedAt(),
                domain.getNotes()
        );
    }
}
