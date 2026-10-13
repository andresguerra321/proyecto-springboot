package com.campus.rentaequipos.identity.application.dto;

import java.util.UUID;

public record ProviderProfileRequest(
        UUID userId,
        String companyName,
        String taxId,
        String phone,
        String address,
        String city
) {}
