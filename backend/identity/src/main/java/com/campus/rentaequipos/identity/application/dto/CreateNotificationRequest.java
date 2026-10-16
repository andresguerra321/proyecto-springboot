package com.campus.rentaequipos.identity.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateNotificationRequest(
        @NotBlank(message = "El título de la notificación es obligatorio")
        @Size(max = 200, message = "El título no puede superar 200 caracteres")
        String title,

        @NotBlank(message = "El mensaje de la notificación es obligatorio")
        String message,

        String type,      // "SUCCESS", "INFO", "WARNING", "ERROR"
        String category,  // "RENTAL", "PAYMENT", "WARRANTY", "RETURN", "SYSTEM"
        String link       // e.g. "#/client"
) {}
