package com.campus.rentaequipos.identity.application.dto;

import java.util.UUID;

public record VerifySessionResponse(
        UUID id,
        String nombre,
        String email,
        String rol,
        String username
) {
    public VerifySessionResponse(UUID id, String nombre, String email, String rol) {
        this(id, nombre, email, rol, null);
    }
}
