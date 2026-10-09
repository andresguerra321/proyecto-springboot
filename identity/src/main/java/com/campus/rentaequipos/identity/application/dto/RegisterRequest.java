package com.campus.rentaequipos.identity.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Set;

public record RegisterRequest(
        @NotBlank(message = "Username cannot be blank")
        String username,
        
        @NotBlank(message = "Email cannot be blank")
        @Email(message = "Invalid email format")
        String email,
        
        @NotBlank(message = "Password cannot be blank")
        String password,
        
        Set<String> roles
) {}
