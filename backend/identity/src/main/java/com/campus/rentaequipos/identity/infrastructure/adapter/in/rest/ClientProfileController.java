package com.campus.rentaequipos.identity.infrastructure.adapter.in.rest;

import com.campus.rentaequipos.identity.application.dto.ClientProfileRequest;
import com.campus.rentaequipos.identity.application.dto.ClientProfileResponse;
import com.campus.rentaequipos.identity.application.usecase.ProfileUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clients")
@Tag(name = "Client Profiles", description = "Gestión de perfiles comerciales de clientes y contratistas")
@SecurityRequirement(name = "bearerAuth")
public class ClientProfileController {

    private final ProfileUseCase profileUseCase;

    public ClientProfileController(ProfileUseCase profileUseCase) {
        this.profileUseCase = profileUseCase;
    }

    @PostMapping
    @Operation(summary = "Crear perfil de cliente", description = "Registra los datos comerciales o personales de un cliente")
    public ResponseEntity<ClientProfileResponse> createClientProfile(
            @RequestBody ClientProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        ClientProfileRequest effective = request;
        if (!isAdmin && userDetails != null) {
            UUID ownUserId = profileUseCase.getUserIdByUsername(userDetails.getUsername());
            effective = new ClientProfileRequest(ownUserId, request.fullName(), request.documentType(), request.documentNumber(), request.phone(), request.address(), request.city());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(profileUseCase.createClientProfile(effective));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener perfil del cliente autenticado", description = "Obtiene los datos del cliente logueado actualmente")
    public ResponseEntity<ClientProfileResponse> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profileUseCase.getClientProfileByUsername(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener perfil de cliente por ID", description = "Consulta los detalles de un cliente por su UUID")
    public ResponseEntity<ClientProfileResponse> getClientById(@PathVariable UUID id) {
        return ResponseEntity.ok(profileUseCase.getClientProfileById(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Obtener perfil de cliente por User ID", description = "Consulta el perfil del cliente asociado a un ID de usuario")
    public ResponseEntity<ClientProfileResponse> getClientByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(profileUseCase.getClientProfileByUserId(userId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVEEDOR')")
    @Operation(summary = "Listar todos los clientes", description = "Consulta la lista de clientes registrados en la plataforma")
    public ResponseEntity<List<ClientProfileResponse>> getAllClients() {
        return ResponseEntity.ok(profileUseCase.getAllClientProfiles());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar perfil de cliente", description = "Modifica los datos de contacto o dirección del cliente (Solo el propio cliente o ADMIN)")
    public ResponseEntity<ClientProfileResponse> updateClientProfile(@PathVariable UUID id,
                                                                     @RequestBody ClientProfileRequest request,
                                                                     @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && userDetails != null) {
            ClientProfileResponse existing = profileUseCase.getClientProfileById(id);
            UUID ownUserId = profileUseCase.getUserIdByUsername(userDetails.getUsername());
            if (!existing.userId().equals(ownUserId)) {
                throw new org.springframework.security.access.AccessDeniedException("Acceso denegado: no puede modificar el perfil de otro cliente");
            }
        }
        return ResponseEntity.ok(profileUseCase.updateClientProfile(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar perfil de cliente", description = "Elimina un perfil de cliente del sistema")
    public ResponseEntity<Void> deleteClientProfile(@PathVariable UUID id) {
        profileUseCase.deleteClientProfile(id);
        return ResponseEntity.noContent().build();
    }
}
