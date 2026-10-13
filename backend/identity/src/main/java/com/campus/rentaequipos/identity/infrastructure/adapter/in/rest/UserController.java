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
    @Operation(summary = "Get user by ID", description = "Retrieves user details by their UUID")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(authUseCase.getUserById(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users", description = "Retrieves a list of all registered users (Requires ADMIN role)")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(authUseCase.getAllUsers());
    }
}
