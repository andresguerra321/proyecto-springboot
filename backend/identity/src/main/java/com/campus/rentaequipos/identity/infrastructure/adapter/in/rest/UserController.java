package com.campus.rentaequipos.identity.infrastructure.adapter.in.rest;

import com.campus.rentaequipos.identity.application.dto.UserResponse;
import com.campus.rentaequipos.identity.application.usecase.AuthUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User Profile and Management APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final AuthUseCase authUseCase;

    public UserController(AuthUseCase authUseCase) {
        this.authUseCase = authUseCase;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile", description = "Retrieves information about the currently logged in user")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authUseCase.getUserByUsername(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieves user details by their UUID (Solo el propio usuario o ADMIN)")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse user = authUseCase.getUserById(id);
        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && (userDetails == null || !user.username().equals(userDetails.getUsername()))) {
            throw new org.springframework.security.access.AccessDeniedException("Acceso denegado: no tiene permisos para consultar información de otros usuarios");
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users", description = "Retrieves a list of all registered users (Requires ADMIN role)")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(authUseCase.getAllUsers());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user", description = "Actualiza correo y roles de un usuario (Requiere ADMIN)")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable UUID id,
            @jakarta.validation.Valid @RequestBody com.campus.rentaequipos.identity.application.dto.UpdateUserRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authUseCase.updateUser(id, request, userDetails.getUsername()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Enable / disable user", description = "Activa o desactiva el acceso de un usuario (borrado lógico, Requiere ADMIN)")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable UUID id,
            @jakarta.validation.Valid @RequestBody com.campus.rentaequipos.identity.application.dto.UpdateUserStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authUseCase.setUserEnabled(id, request.enabled(), userDetails.getUsername()));
    }
}
