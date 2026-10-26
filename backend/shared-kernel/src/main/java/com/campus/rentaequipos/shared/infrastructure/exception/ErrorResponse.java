package com.campus.rentaequipos.shared.infrastructure.exception;

import java.time.LocalDateTime;

public record ErrorResponse(
        String path,
        String message,
        int statusCode,
        LocalDateTime timestamp
) {
    public int getStatus() {
        return statusCode;
    }
}
