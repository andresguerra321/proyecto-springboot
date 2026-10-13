package com.campus.rentaequipos.identity.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ClientProfileResponse(
        UUID id,
        UUID userId,
        String fullName,
        String documentType,
        String documentNumber,
        String phone,
        String address,
        String city,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
