package com.campus.rentaequipos.identity.application.dto;

import java.util.Set;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        boolean enabled,
        Set<String> roles
) {}
