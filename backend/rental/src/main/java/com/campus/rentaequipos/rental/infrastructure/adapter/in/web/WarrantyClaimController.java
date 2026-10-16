package com.campus.rentaequipos.rental.infrastructure.adapter.in.web;

import com.campus.rentaequipos.catalog.infrastructure.security.ProviderOwnershipGuard;
import com.campus.rentaequipos.rental.application.dto.UpdateClaimStatusRequest;
import com.campus.rentaequipos.rental.application.dto.WarrantyClaimRequest;
import com.campus.rentaequipos.rental.application.dto.WarrantyClaimResponse;
import com.campus.rentaequipos.rental.application.usecase.WarrantyClaimUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rentals")
@Tag(name = "Warranty & Exchange Claims", description = "Gestión de solicitudes de cambio de maquinaria en faena (<24h), garantías y reembolsos")
@SecurityRequirement(name = "bearerAuth")
public class WarrantyClaimController {

    private final WarrantyClaimUseCase warrantyClaimUseCase;
    private final ProviderOwnershipGuard guard;
    private final JdbcTemplate jdbcTemplate;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public WarrantyClaimController(WarrantyClaimUseCase warrantyClaimUseCase,
                                   ProviderOwnershipGuard guard,
                                   JdbcTemplate jdbcTemplate,
                                   org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.warrantyClaimUseCase = warrantyClaimUseCase;
        this.guard = guard;
        this.jdbcTemplate = jdbcTemplate;
        this.eventPublisher = eventPublisher;
    }

    @PostMapping("/{rentalId}/claims")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    @Operation(summary = "Radicar solicitud de cambio o garantía", description = "El cliente radica una solicitud de sustitución de equipo en obra por avería o reclamo")
    public ResponseEntity<WarrantyClaimResponse> createClaim(@PathVariable UUID rentalId,
                                                             @RequestBody WarrantyClaimRequest request,
                                                             @AuthenticationPrincipal UserDetails userDetails) {
        if (!guard.isAdmin(userDetails) && !guard.isClientOwnerOfRental(rentalId, userDetails)) {
            throw new AccessDeniedException("Acceso denegado: solo el cliente titular de la reserva puede radicar garantías");
        }
        WarrantyClaimResponse created = warrantyClaimUseCase.createClaim(rentalId, request);
        try {
            UUID userId = jdbcTemplate.query(
                    "SELECT u.id FROM users u WHERE u.username = ?",
                    rs -> rs.next() ? (UUID) rs.getObject("id") : null,
                    userDetails.getUsername());

            if (userId != null) {
                eventPublisher.publishEvent(new com.campus.rentaequipos.shared.domain.event.NotificationEvent(
                        userId,
                        "Reclamo de Garantía #" + created.ticketNumber(),
                        "Se ha radicado tu solicitud (" + created.claimType() + ") por falla " + created.faultType() + ". Prioridad: " + created.urgency() + ".",
                        "WARNING",
                        "WARRANTY",
                        "#/client"
                ));
            }
        } catch (Exception ignored) {}

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{rentalId}/claims")
    @Operation(summary = "Listar reclamos de un alquiler", description = "Consulta los radicados de garantía asociados a un contrato de alquiler")
    public ResponseEntity<List<WarrantyClaimResponse>> getClaimsByRental(@PathVariable UUID rentalId,
                                                                         @AuthenticationPrincipal UserDetails userDetails) {
        assertCanViewRentalClaims(rentalId, userDetails);
        return ResponseEntity.ok(warrantyClaimUseCase.getClaimsByRental(rentalId));
    }

    @GetMapping("/claims/provider/{providerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVEEDOR')")
    @Operation(summary = "Listar reclamos por proveedor", description = "Permite al proveedor visualizar todas las solicitudes de cambio de sus máquinas")
    public ResponseEntity<List<WarrantyClaimResponse>> getClaimsByProvider(@PathVariable UUID providerId,
                                                                           @AuthenticationPrincipal UserDetails userDetails) {
        UUID resolved = jdbcTemplate.query(
                "SELECT id FROM provider_profiles WHERE id = ? OR user_id = ?",
                rs -> rs.next() ? (UUID) rs.getObject("id") : null,
                providerId, providerId);

        if (!guard.isAdmin(userDetails)) {
            UUID own = guard.findOwnProviderId(userDetails);
            if (own == null || !own.equals(resolved)) {
                throw new AccessDeniedException("Acceso denegado: no tiene permisos para consultar reclamos de otro proveedor");
            }
        }
        if (resolved == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(warrantyClaimUseCase.getClaimsByProvider(resolved));
    }

    @GetMapping("/claims/{id}")
    @Operation(summary = "Consultar detalle de un reclamo por ID", description = "Obtiene información del radicado y estado de atención")
    public ResponseEntity<WarrantyClaimResponse> getClaimById(@PathVariable UUID id) {
        return ResponseEntity.ok(warrantyClaimUseCase.getClaimById(id));
    }

    @PatchMapping("/claims/{id}/status")
    @PreAuthorize("hasAnyRole('PROVEEDOR', 'ADMIN')")
    @Operation(summary = "Actualizar estado de atención del reclamo", description = "El proveedor aprueba, despacha el equipo de reemplazo o resuelve la garantía")
    public ResponseEntity<WarrantyClaimResponse> updateClaimStatus(@PathVariable UUID id,
                                                                   @RequestBody UpdateClaimStatusRequest request,
                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        WarrantyClaimResponse claim = warrantyClaimUseCase.getClaimById(id);
        if (!guard.isAdmin(userDetails)) {
            guard.assertProviderOwnsRental(claim.rentalId(), userDetails);
        }
        return ResponseEntity.ok(warrantyClaimUseCase.updateClaimStatus(id, request));
    }

    private void assertCanViewRentalClaims(UUID rentalId, UserDetails user) {
        if (guard.isAdmin(user)) return;
        if (guard.isClientOwnerOfRental(rentalId, user)) return;
        if (guard.isProviderOfRental(rentalId, user)) return;
        throw new AccessDeniedException("Acceso denegado: este alquiler no le pertenece");
    }
}
