package com.campus.rentaequipos.identity.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record RegisterRequest(
        @NotBlank(message = "El nombre de usuario no puede estar vacío")
        @Size(min = 3, max = 50, message = "El nombre de usuario debe tener entre 3 y 50 caracteres")
        String username,
        
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "Formato de correo electrónico no válido")
        String email,
        
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        String password,
        
        Set<String> roles,

        // Datos para perfil comercial (Cliente o Proveedor)
        String fullName,
        String documentType,
        String documentNumber,
        String phone,
        String address,
        String city,
        String companyName,
        String taxId
) {}

