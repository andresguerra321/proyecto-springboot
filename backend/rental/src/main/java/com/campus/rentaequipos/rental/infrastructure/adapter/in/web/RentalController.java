package com.campus.rentaequipos.rental.infrastructure.adapter.in.web;

import com.campus.rentaequipos.rental.application.dto.RentalRequest;
import com.campus.rentaequipos.rental.application.dto.RentalResponse;
import com.campus.rentaequipos.rental.application.usecase.RentalUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rentals")
@Tag(name = "Rental", description = "Rental Management APIs")
public class RentalController {

    private final RentalUseCase rentalUseCase;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public RentalController(RentalUseCase rentalUseCase, org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.rentalUseCase = rentalUseCase;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all rentals", description = "Retrieves all rentals in the system (Solo Administradores)")
    public ResponseEntity<List<RentalResponse>> getAllRentals() {
        return ResponseEntity.ok(rentalUseCase.getAllRentals());
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new rental", description = "Creates a new rental reservation for a client")
    public ResponseEntity<RentalResponse> createRental(@RequestBody RentalRequest request) {
        RentalResponse response = rentalUseCase.createRental(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/client/{clientId}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENTE', 'PROVEEDOR')")
    @Operation(summary = "Get client rentals", description = "Retrieves all rentals for a specific client (Protegido contra IDOR)")
    public ResponseEntity<List<RentalResponse>> getClientRentals(
            @PathVariable UUID clientId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        
        boolean isAdminOrProvider = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_PROVEEDOR"));

        if (!isAdminOrProvider && userDetails != null) {
            String clientOwnerUsername = jdbcTemplate.query(
                    "SELECT u.username FROM client_profiles c JOIN users u ON c.user_id = u.id WHERE c.id = ?",
                    rs -> rs.next() ? rs.getString("username") : null,
                    clientId
            );
            if (clientOwnerUsername == null || !clientOwnerUsername.equals(userDetails.getUsername())) {
                throw new org.springframework.security.access.AccessDeniedException("Acceso denegado: no tiene permisos para consultar el historial de reservas de otro cliente");
            }
        }
        return ResponseEntity.ok(rentalUseCase.getClientRentals(clientId));
    }

    @GetMapping("/provider/{providerId}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVEEDOR')")
    @Operation(summary = "Get provider rentals", description = "Retrieves all rentals/solicitudes associated with a provider's equipment (Protegido contra IDOR)")
    public ResponseEntity<List<RentalResponse>> getProviderRentals(
            @PathVariable UUID providerId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {

        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && userDetails != null) {
            String providerOwnerUsername = jdbcTemplate.query(
                    "SELECT u.username FROM provider_profiles p JOIN users u ON p.user_id = u.id WHERE p.id = ?",
                    rs -> rs.next() ? rs.getString("username") : null,
                    providerId
            );
            if (providerOwnerUsername == null || !providerOwnerUsername.equals(userDetails.getUsername())) {
                throw new org.springframework.security.access.AccessDeniedException("Acceso denegado: no tiene permisos para consultar los alquileres de otro proveedor");
            }
        }
        return ResponseEntity.ok(rentalUseCase.getProviderRentals(providerId));
    }

    @GetMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get a rental by ID", description = "Retrieves a specific rental by its ID")
    public ResponseEntity<RentalResponse> getRentalById(@PathVariable UUID id) {
        return ResponseEntity.ok(rentalUseCase.getRentalById(id));
    }

    @PatchMapping("/{id}/confirm")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Confirm a rental", description = "Confirms a pending rental reservation")
    public ResponseEntity<RentalResponse> confirmRental(@PathVariable UUID id) {
        return ResponseEntity.ok(rentalUseCase.confirmRental(id));
    }

    @PatchMapping("/{id}/cancel")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cancel a rental", description = "Cancels a rental and releases the tools back to available")
    public ResponseEntity<RentalResponse> cancelRental(@PathVariable UUID id) {
        return ResponseEntity.ok(rentalUseCase.cancelRental(id));
    }

    @PatchMapping("/{id}/start")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Start a rental (Handover)", description = "Sets rental status to IN_PROGRESS upon equipment handover")
    public ResponseEntity<RentalResponse> startRental(@PathVariable UUID id) {
        return ResponseEntity.ok(rentalUseCase.startRental(id));
    }

    @PatchMapping("/{id}/complete")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Complete a rental (Return)", description = "Completes the rental upon return and releases equipment")
    public ResponseEntity<RentalResponse> completeRental(@PathVariable UUID id) {
        return ResponseEntity.ok(rentalUseCase.completeRental(id));
    }
}
