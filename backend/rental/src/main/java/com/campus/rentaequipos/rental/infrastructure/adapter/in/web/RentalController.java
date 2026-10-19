package com.campus.rentaequipos.rental.infrastructure.adapter.in.web;

import com.campus.rentaequipos.catalog.infrastructure.security.ProviderOwnershipGuard;
import com.campus.rentaequipos.rental.application.dto.RentalRequest;
import com.campus.rentaequipos.rental.application.dto.RentalResponse;
import com.campus.rentaequipos.rental.application.usecase.RentalUseCase;
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

/**
 * API de alquileres con autorización a nivel de objeto (Anti-IDOR / BOLA):
 * <ul>
 *   <li>CLIENTE: solo crea, consulta y cancela SUS propios alquileres.</li>
 *   <li>PROVEEDOR: solo consulta y opera (confirmar, entregar, devolver, rechazar) alquileres que incluyen SUS equipos.</li>
 *   <li>ADMIN: acceso total.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/rentals")
@Tag(name = "Rental", description = "Rental Management APIs")
@SecurityRequirement(name = "bearerAuth")
public class RentalController {

    private final RentalUseCase rentalUseCase;
    private final JdbcTemplate jdbcTemplate;
    private final ProviderOwnershipGuard guard;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public RentalController(RentalUseCase rentalUseCase, JdbcTemplate jdbcTemplate, ProviderOwnershipGuard guard,
                            org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.rentalUseCase = rentalUseCase;
        this.jdbcTemplate = jdbcTemplate;
        this.guard = guard;
        this.eventPublisher = eventPublisher;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all rentals", description = "Retrieves all rentals in the system (Solo Administradores)")
    public ResponseEntity<List<RentalResponse>> getAllRentals() {
        return ResponseEntity.ok(rentalUseCase.getAllRentals());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    @Operation(summary = "Create a new rental", description = "Crea una reserva. Un CLIENTE siempre reserva a su propio nombre (se ignora clientId del body).")
    public ResponseEntity<RentalResponse> createRental(@RequestBody RentalRequest request,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        UUID effectiveClientId;
        if (guard.isAdmin(userDetails) && request.clientId() != null) {
            effectiveClientId = resolveExistingClientProfileId(request.clientId());
            if (effectiveClientId == null) {
                throw new IllegalArgumentException("El cliente indicado no existe");
            }
        } else {
            effectiveClientId = ensureOwnClientProfile(userDetails);
        }

        String deliveryAddress = request.deliveryAddress();
        String contactPhone = request.contactPhone();
        if ((deliveryAddress == null || deliveryAddress.isBlank()) || (contactPhone == null || contactPhone.isBlank())) {
            try {
                java.util.Map<String, Object> profile = jdbcTemplate.queryForMap(
                        "SELECT address, city, phone FROM client_profiles WHERE id = ?", effectiveClientId);
                if (deliveryAddress == null || deliveryAddress.isBlank()) {
                    String addr = (String) profile.get("address");
                    String city = (String) profile.get("city");
                    deliveryAddress = (addr != null ? addr : "") + (city != null && !city.isBlank() ? ", " + city : "");
                    if (deliveryAddress.isBlank()) deliveryAddress = "Calle 134 # 19-45, Bogotá D.C.";
                }
                if (contactPhone == null || contactPhone.isBlank()) {
                    contactPhone = (String) profile.get("phone");
                    if (contactPhone == null || contactPhone.isBlank()) contactPhone = "3001234567";
                }
            } catch (Exception ignored) {
                if (deliveryAddress == null || deliveryAddress.isBlank()) deliveryAddress = "Calle 134 # 19-45, Bogotá D.C.";
                if (contactPhone == null || contactPhone.isBlank()) contactPhone = "3001234567";
            }
        }

        RentalRequest adjusted = new RentalRequest(
                effectiveClientId, 
                request.startDate(), 
                request.endDate(), 
                request.toolIds(),
                deliveryAddress,
                contactPhone
        );
        RentalResponse response = rentalUseCase.createRental(adjusted);

        try {
            UUID targetUserId = jdbcTemplate.query(
                    "SELECT user_id FROM client_profiles WHERE id = ?",
                    rs -> rs.next() ? (UUID) rs.getObject("user_id") : null,
                    response.clientId());

            if (targetUserId != null) {
                String toolNames = jdbcTemplate.query(
                        "SELECT STRING_AGG(DISTINCT t.name, ', ') as names FROM rental_items ri JOIN tools t ON ri.tool_id = t.id WHERE ri.rental_id = ?",
                        rs -> rs.next() ? rs.getString("names") : null,
                        response.id());

                String equipmentText = toolNames != null && !toolNames.isBlank() ? toolNames : "equipo";
                String msg = "Has reservado " + equipmentText + " (" + response.rentalCode() + ") del " +
                        response.startDate() + " al " + response.endDate() + ". Total: $" + response.totalAmount() + ".";

                eventPublisher.publishEvent(new com.campus.rentaequipos.shared.domain.event.NotificationEvent(
                        targetUserId,
                        "¡Alquiler Confirmado!",
                        msg,
                        "SUCCESS",
                        "RENTAL",
                        "#/client"
                ));
            }
        } catch (Exception ignored) {}

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENTE')")
    @Operation(summary = "Get client rentals", description = "Historial de un cliente (acepta client_profiles.id o users.id). Protegido contra IDOR.")
    public ResponseEntity<List<RentalResponse>> getClientRentals(@PathVariable UUID clientId,
                                                                 @AuthenticationPrincipal UserDetails userDetails) {
        UUID resolved;
        if (guard.isAdmin(userDetails)) {
            resolved = resolveExistingClientProfileId(clientId);
            if (resolved == null) return ResponseEntity.ok(List.of());
        } else {
            UUID own = ensureOwnClientProfile(userDetails);
            UUID ownUserId = findUserId(userDetails);
            if (!clientId.equals(own) && !clientId.equals(ownUserId)) {
                throw new AccessDeniedException("Acceso denegado: no tiene permisos para consultar el historial de reservas de otro cliente");
            }
            resolved = own;
        }
        return ResponseEntity.ok(rentalUseCase.getClientRentals(resolved));
    }

    @GetMapping("/provider/{providerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVEEDOR')")
    @Operation(summary = "Get provider rentals", description = "Solicitudes sobre equipos de un proveedor (acepta provider_profiles.id o users.id). Protegido contra IDOR.")
    public ResponseEntity<List<RentalResponse>> getProviderRentals(@PathVariable UUID providerId,
                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        UUID resolved = jdbcTemplate.query(
                "SELECT id FROM provider_profiles WHERE id = ? OR user_id = ?",
                rs -> rs.next() ? (UUID) rs.getObject("id") : null,
                providerId, providerId);

        if (!guard.isAdmin(userDetails)) {
            UUID own = guard.findOwnProviderId(userDetails);
            if (own == null || !own.equals(resolved)) {
                throw new AccessDeniedException("Acceso denegado: no tiene permisos para consultar los alquileres de otro proveedor");
            }
        }
        if (resolved == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(rentalUseCase.getProviderRentals(resolved));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a rental by ID", description = "Solo el cliente dueño, el proveedor de los equipos o un ADMIN")
    public ResponseEntity<RentalResponse> getRentalById(@PathVariable UUID id,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        assertCanView(id, userDetails);
        return ResponseEntity.ok(rentalUseCase.getRentalById(id));
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('PROVEEDOR', 'ADMIN')")
    @Operation(summary = "Confirm a rental", description = "Confirma manualmente una reserva PENDING sin pago registrado (solo proveedor dueño de los equipos)")
    public ResponseEntity<RentalResponse> confirmRental(@PathVariable UUID id,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        guard.assertProviderOwnsRental(id, userDetails);
        return ResponseEntity.ok(rentalUseCase.confirmRental(id));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel a rental", description = "Cancela/rechaza la reserva: cliente dueño, proveedor de los equipos o ADMIN")
    public ResponseEntity<RentalResponse> cancelRental(@PathVariable UUID id,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        assertCanView(id, userDetails);
        RentalResponse response = rentalUseCase.cancelRental(id);
        try {
            UUID targetUserId = jdbcTemplate.query(
                    "SELECT user_id FROM client_profiles WHERE id = ?",
                    rs -> rs.next() ? (UUID) rs.getObject("user_id") : null,
                    response.clientId());

            if (targetUserId != null) {
                eventPublisher.publishEvent(new com.campus.rentaequipos.shared.domain.event.NotificationEvent(
                        targetUserId,
                        "Alquiler Cancelado",
                        "Tu reserva (" + response.rentalCode() + ") ha sido cancelada.",
                        "INFO",
                        "RENTAL",
                        "#/client"
                ));
            }
        } catch (Exception ignored) {}
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('PROVEEDOR', 'ADMIN')")
    @Operation(summary = "Start a rental (Handover)", description = "Registra la entrega (CONFIRMED -> IN_PROGRESS). Solo proveedor dueño de los equipos.")
    public ResponseEntity<RentalResponse> startRental(@PathVariable UUID id,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        guard.assertProviderOwnsRental(id, userDetails);
        RentalResponse response = rentalUseCase.startRental(id);
        try {
            UUID targetUserId = jdbcTemplate.query(
                    "SELECT user_id FROM client_profiles WHERE id = ?",
                    rs -> rs.next() ? (UUID) rs.getObject("user_id") : null,
                    response.clientId());

            if (targetUserId != null) {
                eventPublisher.publishEvent(new com.campus.rentaequipos.shared.domain.event.NotificationEvent(
                        targetUserId,
                        "¡Equipo en Despacho hacia Obra!",
                        "Tu reserva (" + response.rentalCode() + ") ha sido despachada por el proveedor y va en camino a tu obra.",
                        "SUCCESS",
                        "RENTAL",
                        "#/client"
                ));
            }
        } catch (Exception ignored) {}
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('PROVEEDOR', 'ADMIN')")
    @Operation(summary = "Complete a rental (Return)", description = "Registra la devolución (IN_PROGRESS -> COMPLETED). Solo proveedor dueño de los equipos.")
    public ResponseEntity<RentalResponse> completeRental(@PathVariable UUID id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        guard.assertProviderOwnsRental(id, userDetails);
        RentalResponse response = rentalUseCase.completeRental(id);
        try {
            UUID targetUserId = jdbcTemplate.query(
                    "SELECT user_id FROM client_profiles WHERE id = ?",
                    rs -> rs.next() ? (UUID) rs.getObject("user_id") : null,
                    response.clientId());

            if (targetUserId != null) {
                eventPublisher.publishEvent(new com.campus.rentaequipos.shared.domain.event.NotificationEvent(
                        targetUserId,
                        "¡Devolución e Inspección Finalizada!",
                        "El equipo de tu reserva (" + response.rentalCode() + ") ha sido recibido en bodega e inspeccionado satisfactoriamente.",
                        "SUCCESS",
                        "RENTAL",
                        "#/client"
                ));
            }
        } catch (Exception ignored) {}
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ helpers

    private void assertCanView(UUID rentalId, UserDetails user) {
        if (guard.isAdmin(user)) return;
        if (guard.isClientOwnerOfRental(rentalId, user)) return;
        if (guard.isProviderOfRental(rentalId, user)) return;
        throw new AccessDeniedException("Acceso denegado: este alquiler no le pertenece");
    }

    private UUID findUserId(UserDetails user) {
        return jdbcTemplate.query("SELECT id FROM users WHERE username = ?",
                rs -> rs.next() ? (UUID) rs.getObject("id") : null, user.getUsername());
    }

    /** Resuelve client_profiles.id a partir de un id de perfil o de usuario, SIN crear nada. */
    private UUID resolveExistingClientProfileId(UUID idOrUserId) {
        return jdbcTemplate.query(
                "SELECT id FROM client_profiles WHERE id = ? OR user_id = ?",
                rs -> rs.next() ? (UUID) rs.getObject("id") : null,
                idOrUserId, idOrUserId);
    }

    /**
     * Devuelve el client_profiles.id del usuario autenticado. Si una cuenta legada no tiene perfil,
     * lo crea solo para SÍ MISMA (nunca para terceros), evitando la violación de rentals_client_id_fkey.
     */
    private UUID ensureOwnClientProfile(UserDetails user) {
        if (user == null) throw new AccessDeniedException("Acceso denegado: sesión no válida");
        UUID userId = findUserId(user);
        if (userId == null) throw new AccessDeniedException("Acceso denegado: usuario inexistente");
        UUID profileId = resolveExistingClientProfileId(userId);
        if (profileId != null) return profileId;

        UUID newId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO client_profiles (id, user_id, full_name, document_type, document_number, phone, address, city) " +
                "VALUES (?, ?, ?, 'CC', ?, '3000000000', 'Por actualizar', 'Por actualizar')",
                newId, userId, user.getUsername(),
                "PEND-" + userId.toString().substring(0, 8).toUpperCase());
        return newId;
    }
}
