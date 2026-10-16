package com.campus.rentaequipos.identity.application.dto;

import com.campus.rentaequipos.identity.domain.model.Notification;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID userId,
        String title,
        String message,
        String type,
        String category,
        String link,
        boolean read,
        LocalDateTime createdAt,
        LocalDateTime readAt,
        String timeAgo
) {
    public static NotificationResponse fromDomain(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getUserId(),
                n.getTitle(),
                n.getMessage(),
                n.getType(),
                n.getCategory(),
                n.getLink(),
                n.isRead(),
                n.getCreatedAt(),
                n.getReadAt(),
                formatTimeAgo(n.getCreatedAt())
        );
    }

    public static String formatTimeAgo(LocalDateTime dt) {
        if (dt == null) return "Ahora mismo";
        Duration duration = Duration.between(dt, LocalDateTime.now());
        long seconds = duration.getSeconds();
        if (seconds < 60) return "Ahora mismo";
        long minutes = duration.toMinutes();
        if (minutes < 60) return "Hace " + minutes + " min";
        long hours = duration.toHours();
        if (hours < 24) return "Hace " + hours + (hours == 1 ? " hora" : " horas");
        long days = duration.toDays();
        if (days < 30) return "Hace " + days + (days == 1 ? " día" : " días");
        long months = days / 30;
        return "Hace " + months + (months == 1 ? " mes" : " meses");
    }
}
