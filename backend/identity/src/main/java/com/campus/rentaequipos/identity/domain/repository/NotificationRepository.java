package com.campus.rentaequipos.identity.domain.repository;

import com.campus.rentaequipos.identity.domain.model.Notification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository {
    Notification save(Notification notification);
    Optional<Notification> findById(UUID id);
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserIdAndReadFalse(UUID userId);
    void markAllAsReadByUserId(UUID userId);
    void deleteByIdAndUserId(UUID id, UUID userId);
}
