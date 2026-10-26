package com.campus.rentaequipos.rental.infrastructure.adapter.in.web;

import com.campus.rentaequipos.catalog.infrastructure.security.ProviderOwnershipGuard;
import com.campus.rentaequipos.rental.application.dto.RejectRentalRequest;
import com.campus.rentaequipos.rental.application.dto.RentalResponse;
import com.campus.rentaequipos.rental.application.dto.RentalStatusHistoryResponse;
import com.campus.rentaequipos.rental.application.usecase.RentalUseCase;
import com.campus.rentaequipos.shared.domain.event.NotificationEvent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints del examen: el proveedor aprueba o rechaza solicitudes de alquiler PENDIENTES.
 * También expuestos bajo /api/v1/rentals/{id}/aprobar|rechazar por consistencia.
 */
@RestController
@Tag(name = "Reservas", description = "Aprobación y rechazo de reservas por el proveedor o administrador")
@SecurityRequirement(name = "bearerAuth")
public class ReservaController {

    private final RentalUseCase rentalUseCase;
    private final ProviderOwnershipGuard guard;
    private final ApplicationEventPublisher eventPublisher;
    private final JdbcTemplate jdbcTemplate;

    public ReservaController(RentalUseCase rentalUseCase,
                             ProviderOwnershipGuard guard,
                             ApplicationEventPublisher eventPublisher,
                             JdbcTemplate jdbcTemplate) {
        this.rentalUseCase = rentalUseCase;
        this.guard = guard;
        this.eventPublisher = eventPublisher;
        this.jdbcTemplate = jdbcTemplate;
    }

    private void notifyClient(UUID clientId, String title, String message, String level) {
        if (clientId == null || eventPublisher == null || jdbcTemplate == null) return;
        try {
            UUID targetUserId = jdbcTemplate.query(
                    "SELECT user_id FROM client_profiles WHERE id = ?",
                    rs -> rs.next() ? (UUID) rs.getObject("user_id") : null,
                    clientId);

            if (targetUserId != null) {
                eventPublisher.publishEvent(new NotificationEvent(
                        targetUserId,
                        title,
                        message,
                        level,
                        "RENTAL",
                        "#/client"
                ));
            }
        } catch (Exception ignored) {}
    }

    @GetMapping({"/api/reservas", "/api/reservas/pendientes", "/api/v1/reservas", "/api/v1/reservas/pendientes"})
    @PreAuthorize("hasAnyRole('PROVEEDOR', 'ADMIN')")
    @Operation(summary = "Listar reservas", description = "ADMIN lista todas o filtra por proveedor/estado; PROVEEDOR consulta las reservas sobre sus propios equipos.")
    public ResponseEntity<List<RentalResponse>> listReservas(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID providerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (guard.isAdmin(userDetails)) {
            if (providerId != null || status != null) {
                return ResponseEntity.ok(rentalUseCase.searchRentals(status, null, null, providerId));
            }
            return ResponseEntity.ok(rentalUseCase.getAllRentals());
        }
        UUID ownProviderId = guard.findOwnProviderId(userDetails);
        if (ownProviderId == null) {
            return ResponseEntity.ok(List.of());
        }
        List<RentalResponse> providerRentals = rentalUseCase.getProviderRentals(ownProviderId);
        if (status != null && !status.isBlank()) {
            String cleanStatus = status.trim().toUpperCase();
            providerRentals = providerRentals.stream()
                    .filter(r -> r.status() != null && r.status().equalsIgnoreCase(cleanStatus))
                    .toList();
        }
        return ResponseEntity.ok(providerRentals);
    }

    @RequestMapping(value = {"/api/reservas/{id}/aprobar", "/api/v1/rentals/{id}/aprobar", "/api/v1/reservas/{id}/aprobar"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('PROVEEDOR', 'ADMIN')")
    @Operation(summary = "Aprobar reserva", description = "PENDING -> CONFIRMED (APROBADA). Proveedor dueño de los equipos o Administrador.")
    public ResponseEntity<RentalResponse> aprobarReserva(@PathVariable UUID id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        if (!guard.isAdmin(userDetails)) {
            guard.assertProviderOwnsRental(id, userDetails);
        }
        String actor = userDetails != null ? userDetails.getUsername() : "PROVEEDOR";
        RentalResponse response = rentalUseCase.aprobarReserva(id, actor);
        if (response != null) {
            notifyClient(response.clientId(), "¡Reserva Aprobada!",
                    "Tu reserva (" + response.rentalCode() + ") ha sido aprobada por el proveedor.", "SUCCESS");
        }
        return ResponseEntity.ok(response);
    }

    @RequestMapping(value = {"/api/reservas/{id}/rechazar", "/api/v1/rentals/{id}/rechazar", "/api/v1/reservas/{id}/rechazar"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('PROVEEDOR', 'ADMIN')")
    @Operation(summary = "Rechazar reserva", description = "PENDING -> REJECTED (RECHAZADA). Proveedor dueño de los equipos o Administrador. Soporta motivo de rechazo.")
    public ResponseEntity<RentalResponse> rechazarReserva(@PathVariable UUID id,
                                                          @RequestBody(required = false) RejectRentalRequest request,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        if (!guard.isAdmin(userDetails)) {
            guard.assertProviderOwnsRental(id, userDetails);
        }
        String reason = request != null ? request.reason() : null;
        String actor = userDetails != null ? userDetails.getUsername() : "PROVEEDOR";
        RentalResponse response = rentalUseCase.rechazarReserva(id, reason, actor);
        if (response != null) {
            String msg = (reason != null && !reason.isBlank())
                    ? "Tu reserva (" + response.rentalCode() + ") ha sido rechazada. Motivo: " + reason
                    : "Tu reserva (" + response.rentalCode() + ") ha sido rechazada.";
            notifyClient(response.clientId(), "Reserva Rechazada", msg, "WARNING");
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping({"/api/reservas/{id}/historial", "/api/reservas/{id}/history", "/api/v1/reservas/{id}/historial"})
    @PreAuthorize("hasAnyRole('PROVEEDOR', 'ADMIN', 'CLIENTE')")
    @Operation(summary = "Consultar historial de estados", description = "Historial completo de transiciones de estado de una reserva.")
    public ResponseEntity<List<RentalStatusHistoryResponse>> getRentalHistory(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (!guard.isAdmin(userDetails)) {
            boolean isClient = guard.isClientOwnerOfRental(id, userDetails);
            boolean isProvider = guard.isProviderOfRental(id, userDetails);
            if (!isClient && !isProvider) {
                throw new AccessDeniedException("Acceso denegado al historial de esta reserva");
            }
        }
        return ResponseEntity.ok(rentalUseCase.getRentalHistory(id));
    }
}
