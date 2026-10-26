package com.campus.rentaequipos.billing.infrastructure.adapter.in.web;

import com.campus.rentaequipos.billing.application.dto.PaymentResponse;
import com.campus.rentaequipos.billing.application.usecase.BillingUseCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClientPaymentControllerTest {

    @Mock
    private BillingUseCase billingUseCase;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private ClientPaymentController controller;
    private UserDetails userDetails;
    private UUID userId;
    private UUID clientProfileId;

    @BeforeEach
    void setUp() {
        controller = new ClientPaymentController(billingUseCase, jdbcTemplate);
        userDetails = User.withUsername("cliente_test")
                .password("password")
                .roles("CLIENTE")
                .build();
        userId = UUID.randomUUID();
        clientProfileId = UUID.randomUUID();

        when(jdbcTemplate.queryForObject(
                eq("SELECT id FROM users WHERE username = ?"), eq(UUID.class), any()))
                .thenReturn(userId);
    }

    @Test
    void returnsPaymentsForTheAuthenticatedClient() {
        when(jdbcTemplate.queryForObject(
                eq("SELECT id FROM client_profiles WHERE user_id = ?"), eq(UUID.class), any()))
                .thenReturn(clientProfileId);
        PaymentResponse payment = new PaymentResponse(
                UUID.randomUUID(),
                "PAY-TEST",
                UUID.randomUUID(),
                new BigDecimal("125000.00"),
                "CREDIT_CARD",
                "COMPLETED",
                LocalDateTime.of(2026, 10, 20, 12, 0)
        );
        when(billingUseCase.getPaymentsByClientId(clientProfileId)).thenReturn(List.of(payment));

        List<PaymentResponse> result = controller.getClientPayments(userId, userDetails).getBody();

        assertEquals(List.of(payment), result);
        verify(billingUseCase).getPaymentsByClientId(clientProfileId);
    }

    @Test
    void rejectsRequestsForAnotherClient() {
        when(jdbcTemplate.queryForObject(
                eq("SELECT id FROM client_profiles WHERE user_id = ?"), eq(UUID.class), any()))
                .thenReturn(clientProfileId);

        assertThrows(AccessDeniedException.class,
                () -> controller.getClientPayments(UUID.randomUUID(), userDetails));

        verify(billingUseCase, never()).getPaymentsByClientId(any());
    }

    @Test
    void returnsAnEmptyHistoryWhenTheClientHasNoProfileYet() {
        when(jdbcTemplate.queryForObject(
                eq("SELECT id FROM client_profiles WHERE user_id = ?"), eq(UUID.class), any()))
                .thenThrow(new EmptyResultDataAccessException(1));

        List<PaymentResponse> result = controller.getClientPayments(userId, userDetails).getBody();

        assertEquals(List.of(), result);
        verify(billingUseCase, never()).getPaymentsByClientId(any());
    }
}
