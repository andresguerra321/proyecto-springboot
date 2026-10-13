package com.campus.rentaequipos.identity.application.dto;

public record AuthResponse(
        String token,
        String type,
        String username
) {}
