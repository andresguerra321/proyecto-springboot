package com.campus.rentaequipos.identity.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record RegisterRequest(
        @NotBlank(message = "El nombre de usuario no puede estar vacío")
        @Size(min = 3, max = 30, message = "El nombre de usuario debe tener entre 3 y 30 caracteres")
        @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "El nombre de usuario no puede contener espacios ni caracteres especiales")
        String username,
        
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "Formato de correo electrónico no válido")
        @Size(max = 60, message = "El correo electrónico no puede exceder 60 caracteres")
        String email,
        
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, max = 50, message = "La contraseña debe tener entre 6 y 50 caracteres")
        String password,
        
        Set<String> roles,

        // Datos para perfil comercial (Cliente o Proveedor)
        @Size(max = 60, message = "El nombre o contacto no puede exceder 60 caracteres")
        String fullName,

        @Size(max = 20, message = "El tipo de documento no puede exceder 20 caracteres")
        String documentType,

        @Size(max = 20, message = "El número de documento no puede exceder 20 caracteres")
        String documentNumber,

        @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
        String phone,

        @Size(max = 100, message = "La dirección no puede exceder 100 caracteres")
        String address,

        @Size(max = 50, message = "La ciudad no puede exceder 50 caracteres")
        String city,

        @Size(max = 80, message = "La razón social no puede exceder 80 caracteres")
        String companyName,

        @Size(max = 20, message = "El NIT/RUT no puede exceder 20 caracteres")
        String taxId
) {}

