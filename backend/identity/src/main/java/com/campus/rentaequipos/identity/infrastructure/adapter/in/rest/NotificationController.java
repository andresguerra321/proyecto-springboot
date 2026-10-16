package com.campus.rentaequipos.identity.infrastructure.adapter.in.rest;

import com.campus.rentaequipos.identity.application.dto.CreateNotificationRequest;
import com.campus.rentaequipos.identity.application.dto.NotificationResponse;
import com.campus.rentaequipos.identity.application.usecase.NotificationUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Gestión de notificaciones persistidas de usuario")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationUseCase notificationUseCase;

    public NotificationController(NotificationUseCase notificationUseCase) {
        this.notificationUseCase = notificationUseCase;
    }

    @GetMapping
    @Operation(summary = "Obtener notificaciones del usuario", description = "Consulta todas las notificaciones persistidas del usuario autenticado")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(notificationUseCase.getNotificationsForUser(userDetails.getUsername()));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Obtener conteo de no leídas", description = "Retorna el número de notificaciones no leídas para la campana de alertas")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(Map.of("unreadCount", 0));
        }
        long count = notificationUseCase.getUnreadCountForUser(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Marcar notificación como leída", description = "Actualiza el estado de lectura de una notificación perteneciente al usuario")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(notificationUseCase.markAsRead(id, userDetails.getUsername()));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Marcar todas como leídas", description = "Marca todas las notificaciones no leídas del usuario como leídas")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        notificationUseCase.markAllAsRead(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar notificación", description = "Elimina permanentemente una notificación del usuario")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationUseCase.deleteNotification(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    @Operation(summary = "Crear notificación para usuario", description = "Registra una notificación persistente para el usuario actual")
    public ResponseEntity<NotificationResponse> createNotification(
            @Valid @RequestBody CreateNotificationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificationUseCase.createNotificationForUser(userDetails.getUsername(), request));
    }
}
