package com.campus.rentaequipos.identity.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Notification {
    private final UUID id;
    private final UUID userId;
    private final String title;
    private final String message;
    private final String type;
    private final String category;
    private final String link;
    private boolean read;
    private final LocalDateTime createdAt;
    private LocalDateTime readAt;

    public Notification(UUID id, UUID userId, String title, String message, String type,
                        String category, String link, boolean read, LocalDateTime createdAt, LocalDateTime readAt) {
        this.id = id != null ? id : UUID.randomUUID();
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type != null ? type : "INFO";
        this.category = category != null ? category : "RENTAL";
        this.link = link != null ? link : "#/client";
        this.read = read;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.readAt = readAt;
    }

    public static Notification create(UUID userId, String title, String message, String type, String category, String link) {
        return new Notification(UUID.randomUUID(), userId, title, message, type, category, link, false, LocalDateTime.now(), null);
    }

    public void markAsRead() {
        this.read = true;
        this.readAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getType() {
        return type;
    }

    public String getCategory() {
        return category;
    }

    public String getLink() {
        return link;
    }

    public boolean isRead() {
        return read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }
}
