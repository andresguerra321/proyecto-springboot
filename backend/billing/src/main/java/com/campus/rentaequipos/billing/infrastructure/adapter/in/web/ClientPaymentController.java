package com.campus.rentaequipos.billing.infrastructure.adapter.in.web;

import com.campus.rentaequipos.billing.application.dto.PaymentResponse;
import com.campus.rentaequipos.billing.application.usecase.BillingUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.dao.EmptyResultDataAccessException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pagos")
@SecurityRequirement(name = "bearerAuth")
public class ClientPaymentController {

    private final BillingUseCase billingUseCase;
    private final JdbcTemplate jdbcTemplate;

    public ClientPaymentController(BillingUseCase billingUseCase, JdbcTemplate jdbcTemplate) {
        this.billingUseCase = billingUseCase;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/cliente/{id}")
    @PreAuthorize("hasRole('CLIENTE')")
    @Operation(summary = "Historial de pagos del cliente",
            description = "Consulta los pagos del cliente autenticado. El ID puede ser el del usuario o el perfil de cliente.")
    public ResponseEntity<List<PaymentResponse>> getClientPayments(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = jdbcTemplate.queryForObject(
                "SELECT id FROM users WHERE username = ?",
                UUID.class,
                userDetails.getUsername());

        UUID clientProfileId;
        try {
            clientProfileId = jdbcTemplate.queryForObject(
                    "SELECT id FROM client_profiles WHERE user_id = ?",
                    UUID.class,
                    userId);
        } catch (EmptyResultDataAccessException exception) {
            clientProfileId = null;
        }

        if (!id.equals(userId) && !id.equals(clientProfileId)) {
            throw new AccessDeniedException("Acceso denegado: solo puede consultar sus propios pagos");
        }

        if (clientProfileId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(billingUseCase.getPaymentsByClientId(clientProfileId));
    }
}
