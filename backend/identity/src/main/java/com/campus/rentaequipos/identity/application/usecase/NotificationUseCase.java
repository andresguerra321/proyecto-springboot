package com.campus.rentaequipos.identity.application.usecase;

import com.campus.rentaequipos.identity.application.dto.CreateNotificationRequest;
import com.campus.rentaequipos.identity.application.dto.NotificationResponse;
import com.campus.rentaequipos.identity.domain.model.Notification;
import com.campus.rentaequipos.identity.domain.model.User;
import com.campus.rentaequipos.identity.domain.repository.NotificationRepository;
import com.campus.rentaequipos.identity.domain.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NotificationUseCase {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationUseCase(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    private User resolveUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + username));
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(String username) {
        User user = resolveUser(username);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationResponse::fromDomain)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCountForUser(String username) {
        User user = resolveUser(username);
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(UUID id, String username) {
        User user = resolveUser(username);
        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notificación no encontrada"));

        if (!notif.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("No tiene permisos para modificar esta notificación");
        }

        notif.markAsRead();
        Notification saved = notificationRepository.save(notif);
        return NotificationResponse.fromDomain(saved);
    }

    @Transactional
    public void markAllAsRead(String username) {
        User user = resolveUser(username);
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Transactional
    public void deleteNotification(UUID id, String username) {
        User user = resolveUser(username);
        notificationRepository.deleteByIdAndUserId(id, user.getId());
    }

    @Transactional
    public NotificationResponse createNotification(UUID userId, String title, String message, String type, String category, String link) {
        Notification notif = Notification.create(userId, title, message, type, category, link);
        Notification saved = notificationRepository.save(notif);
        return NotificationResponse.fromDomain(saved);
    }

    @Transactional
    public NotificationResponse createNotificationForUser(String username, CreateNotificationRequest req) {
        User user = resolveUser(username);
        return createNotification(user.getId(), req.title(), req.message(), req.type(), req.category(), req.link());
    }
}
