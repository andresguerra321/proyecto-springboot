package com.campus.rentaequipos.rental.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record WarrantyClaimResponse(
        UUID id,
        String ticketNumber,
        UUID rentalId,
        String rentalCode,
        UUID toolId,
        String toolName,
        String claimType,
        String faultType,
        String urgency,
        String description,
        String contactPhone,
        String deliveryAddress,
        String status,
        String resolutionNotes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
