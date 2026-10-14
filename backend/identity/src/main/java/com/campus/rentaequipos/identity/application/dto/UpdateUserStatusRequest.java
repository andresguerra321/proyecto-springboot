package com.campus.rentaequipos.identity.application.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Petición para activar / desactivar el acceso de un usuario (borrado lógico).
 */
public record UpdateUserStatusRequest(
        @NotNull(message = "Debe indicar el estado 'enabled'")
        Boolean enabled
) {}
