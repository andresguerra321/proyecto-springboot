package com.campus.rentaequipos.shared.domain.event;

import java.util.UUID;

public record NotificationEvent(
        UUID userId,
        String title,
        String message,
        String type,      // "SUCCESS", "INFO", "WARNING", "ERROR"
        String category,  // "RENTAL", "PAYMENT", "WARRANTY", "RETURN", "SYSTEM"
        String link       // e.g. "#/client"
) {}
