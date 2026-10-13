package com.campus.rentaequipos.identity.application.dto;

import java.util.UUID;

public record ClientProfileRequest(
        UUID userId,
        String fullName,
        String documentType,
        String documentNumber,
        String phone,
        String address,
        String city
) {}
