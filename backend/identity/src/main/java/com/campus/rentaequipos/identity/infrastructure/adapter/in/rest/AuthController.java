package com.campus.rentaequipos.identity.infrastructure.adapter.in.rest;

import com.campus.rentaequipos.identity.application.dto.AuthResponse;
import com.campus.rentaequipos.identity.application.dto.LoginRequest;
import com.campus.rentaequipos.identity.application.dto.RegisterRequest;
import com.campus.rentaequipos.identity.application.dto.VerifySessionResponse;
import com.campus.rentaequipos.identity.application.usecase.AuthUseCase;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthUseCase authUseCase;

    public AuthController(AuthUseCase authUseCase) {
        this.authUseCase = authUseCase;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(authUseCase.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authUseCase.login(request));
    }

    @GetMapping("/verify-session")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VerifySessionResponse> verifySession(
            @AuthenticationPrincipal UserDetails userDetails,
            Principal principal
    ) {
        String username = userDetails != null ? userDetails.getUsername() : (principal != null ? principal.getName() : null);
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authUseCase.verifySession(username));
    }
}
