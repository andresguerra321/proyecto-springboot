package com.campus.rentaequipos.identity.infrastructure.adapter.in.rest;

import com.campus.rentaequipos.identity.application.dto.ProviderProfileRequest;
import com.campus.rentaequipos.identity.application.dto.ProviderProfileResponse;
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
@RequestMapping("/api/v1/providers")
@Tag(name = "Provider Profiles", description = "Gestión de perfiles comerciales de empresas y proveedores de maquinaria")
@SecurityRequirement(name = "bearerAuth")
public class ProviderProfileController {

    private final ProfileUseCase profileUseCase;

    public ProviderProfileController(ProfileUseCase profileUseCase) {
        this.profileUseCase = profileUseCase;
    }

    @PostMapping
    @Operation(summary = "Crear perfil de proveedor", description = "Registra los datos comerciales de una empresa proveedora de equipos")
    public ResponseEntity<ProviderProfileResponse> createProviderProfile(
            @RequestBody ProviderProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        ProviderProfileRequest effective = request;
        if (!isAdmin && userDetails != null) {
            UUID ownUserId = profileUseCase.getUserIdByUsername(userDetails.getUsername());
            effective = new ProviderProfileRequest(ownUserId, request.companyName(), request.taxId(), request.phone(), request.address(), request.city());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(profileUseCase.createProviderProfile(effective));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener perfil del proveedor autenticado", description = "Obtiene los datos de la empresa proveedora logueada actualmente")
    public ResponseEntity<ProviderProfileResponse> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profileUseCase.getProviderProfileByUsername(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener perfil de proveedor por ID", description = "Consulta los detalles de un proveedor por su UUID")
    public ResponseEntity<ProviderProfileResponse> getProviderById(@PathVariable UUID id) {
        return ResponseEntity.ok(profileUseCase.getProviderProfileById(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Obtener perfil de proveedor por User ID", description = "Consulta el perfil del proveedor asociado a un ID de usuario")
    public ResponseEntity<ProviderProfileResponse> getProviderByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(profileUseCase.getProviderProfileByUserId(userId));
    }

    @GetMapping
    @Operation(summary = "Listar todos los proveedores", description = "Consulta el catálogo de proveedores de equipos registrados en la plataforma")
    public ResponseEntity<List<ProviderProfileResponse>> getAllProviders() {
        return ResponseEntity.ok(profileUseCase.getAllProviderProfiles());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar perfil de proveedor", description = "Modifica los datos comerciales o de contacto del proveedor (Solo el propio proveedor o ADMIN)")
    public ResponseEntity<ProviderProfileResponse> updateProviderProfile(@PathVariable UUID id,
                                                                         @RequestBody ProviderProfileRequest request,
                                                                         @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && userDetails != null) {
            ProviderProfileResponse existing = profileUseCase.getProviderProfileById(id);
            UUID ownUserId = profileUseCase.getUserIdByUsername(userDetails.getUsername());
            if (!existing.userId().equals(ownUserId)) {
                throw new org.springframework.security.access.AccessDeniedException("Acceso denegado: no puede modificar el perfil de otro proveedor");
            }
        }
        return ResponseEntity.ok(profileUseCase.updateProviderProfile(id, request));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verificar proveedor", description = "Valida y aprueba la cuenta comercial de un proveedor (Solo administradores)")
    public ResponseEntity<ProviderProfileResponse> verifyProvider(@PathVariable UUID id) {
        return ResponseEntity.ok(profileUseCase.verifyProviderProfile(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar perfil de proveedor", description = "Elimina un perfil de proveedor de la plataforma (Solo administradores)")
    public ResponseEntity<Void> deleteProviderProfile(@PathVariable UUID id) {
        profileUseCase.deleteProviderProfile(id);
        return ResponseEntity.noContent().build();
    }
}
