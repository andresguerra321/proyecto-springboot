package com.campus.rentaequipos.rental.infrastructure.adapter.in.web;

import com.campus.rentaequipos.catalog.infrastructure.security.ProviderOwnershipGuard;
import com.campus.rentaequipos.rental.application.dto.RentalResponse;
import com.campus.rentaequipos.rental.application.usecase.RentalUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

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

    public ReservaController(RentalUseCase rentalUseCase, ProviderOwnershipGuard guard) {
        this.rentalUseCase = rentalUseCase;
        this.guard = guard;
    }

    @GetMapping({"/api/reservas", "/api/reservas/pendientes", "/api/v1/reservas", "/api/v1/reservas/pendientes"})
    @PreAuthorize("hasAnyRole('PROVEEDOR', 'ADMIN')")
    @Operation(summary = "Listar reservas", description = "ADMIN lista todas o filtra por proveedor/estado; PROVEEDOR consulta las reservas sobre sus propios equipos.")
    public ResponseEntity<java.util.List<RentalResponse>> listReservas(
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
            return ResponseEntity.ok(java.util.List.of());
        }
        java.util.List<RentalResponse> providerRentals = rentalUseCase.getProviderRentals(ownProviderId);
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
        return ResponseEntity.ok(rentalUseCase.aprobarReserva(id));
    }

    @RequestMapping(value = {"/api/reservas/{id}/rechazar", "/api/v1/rentals/{id}/rechazar", "/api/v1/reservas/{id}/rechazar"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('PROVEEDOR', 'ADMIN')")
    @Operation(summary = "Rechazar reserva", description = "PENDING -> REJECTED (RECHAZADA). Proveedor dueño de los equipos o Administrador.")
    public ResponseEntity<RentalResponse> rechazarReserva(@PathVariable UUID id,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        if (!guard.isAdmin(userDetails)) {
            guard.assertProviderOwnsRental(id, userDetails);
        }
        return ResponseEntity.ok(rentalUseCase.rechazarReserva(id));
    }
}
