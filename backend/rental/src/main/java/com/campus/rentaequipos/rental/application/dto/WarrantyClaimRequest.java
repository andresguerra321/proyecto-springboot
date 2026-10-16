package com.campus.rentaequipos.rental.application.dto;

import java.util.UUID;

public record WarrantyClaimRequest(
        UUID rentalId,
        UUID toolId,
        String claimType,
        String faultType,
        String urgency,
        String description,
        String contactPhone,
        String deliveryAddress
) {}
