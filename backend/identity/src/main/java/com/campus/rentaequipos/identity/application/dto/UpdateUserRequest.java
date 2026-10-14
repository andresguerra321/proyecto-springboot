package com.campus.rentaequipos.identity.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * Petición de actualización de usuario desde el panel de administración.
 */
public record UpdateUserRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo electrónico no es válido")
        @Size(max = 100, message = "El correo no puede superar 100 caracteres")
        String email,

        @NotEmpty(message = "Debe asignar al menos un rol")
        Set<String> roles
) {}
