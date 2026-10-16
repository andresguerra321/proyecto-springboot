package com.campus.rentaequipos.identity.infrastructure.adapter.out.persistence.entity;

import com.campus.rentaequipos.identity.domain.model.Notification;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_notifications")
public class NotificationJpaEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(length = 300)
    private String link;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    public NotificationJpaEntity() {}

    public NotificationJpaEntity(UUID id, UUID userId, String title, String message, String type,
                                 String category, String link, boolean read, LocalDateTime createdAt, LocalDateTime readAt) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.category = category;
        this.link = link;
        this.read = read;
        this.createdAt = createdAt;
        this.readAt = readAt;
    }

    public static NotificationJpaEntity fromDomain(Notification notification) {
        return new NotificationJpaEntity(
                notification.getId(),
                notification.getUserId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getCategory(),
                notification.getLink(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }

    public Notification toDomain() {
        return new Notification(
                this.id,
                this.userId,
                this.title,
                this.message,
                this.type,
                this.category,
                this.link,
                this.read,
                this.createdAt,
                this.readAt
        );
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
}
