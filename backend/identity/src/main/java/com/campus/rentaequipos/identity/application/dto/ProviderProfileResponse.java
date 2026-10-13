package com.campus.rentaequipos.identity.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProviderProfileResponse(
        UUID id,
        UUID userId,
        String companyName,
        String taxId,
        String phone,
        String address,
        String city,
        boolean isVerified,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
