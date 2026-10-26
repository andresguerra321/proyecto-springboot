package com.campus.rentaequipos;

import com.campus.rentaequipos.catalog.infrastructure.security.ProviderOwnershipGuard;
import com.campus.rentaequipos.rental.application.dto.RejectRentalRequest;
import com.campus.rentaequipos.rental.application.dto.RentalResponse;
import com.campus.rentaequipos.rental.application.dto.RentalStatusHistoryResponse;
import com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse;
import com.campus.rentaequipos.rental.application.usecase.RentalUseCase;
import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
import com.campus.rentaequipos.shared.domain.exception.HerramientaNoDisponibleException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReservaWebIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RentalUseCase rentalUseCase;

    @MockBean
    private ProviderOwnershipGuard guard;

    private final UUID rentalId = UUID.randomUUID();
    private final UUID toolId = UUID.randomUUID();

    private RentalResponse buildMockResponse(String status, String rejectionReason) {
        return new RentalResponse(
                rentalId,
                "RNT-TEST123",
                UUID.randomUUID(),
                LocalDate.now().plusDays(2),
                LocalDate.now().plusDays(6),
                4,
                BigDecimal.valueOf(340000.00),
                BigDecimal.valueOf(480000.00),
                BigDecimal.valueOf(820000.00),
                status,
                Collections.emptyList(),
                "Calle 100 # 15-20",
                "+57 300 123 4567",
                rejectionReason
        );
    }

    @Test
    @DisplayName("POST /api/reservas/{id}/aprobar retorna 200 OK y estado CONFIRMED")
    @WithMockUser(roles = "PROVEEDOR")
    void shouldAprobarReservaReturn200() throws Exception {
        when(rentalUseCase.aprobarReserva(eq(rentalId), any())).thenReturn(buildMockResponse("CONFIRMED", null));
        when(rentalUseCase.aprobarReserva(rentalId)).thenReturn(buildMockResponse("CONFIRMED", null));

        mockMvc.perform(post("/api/reservas/{id}/aprobar", rentalId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.rentalCode").value("RNT-TEST123"));
    }

    @Test
    @DisplayName("POST /api/reservas/{id}/aprobar retorna 409 CONFLICT cuando hay conflicto de disponibilidad")
    @WithMockUser(roles = "PROVEEDOR")
    void shouldAprobarReservaReturn409OnConflict() throws Exception {
        when(rentalUseCase.aprobarReserva(eq(rentalId), any()))
                .thenThrow(new HerramientaNoDisponibleException("Martillo Demoledor", "ya tiene otra reserva aprobada en esas fechas"));
        when(rentalUseCase.aprobarReserva(rentalId))
                .thenThrow(new HerramientaNoDisponibleException("Martillo Demoledor", "ya tiene otra reserva aprobada en esas fechas"));

        mockMvc.perform(post("/api/reservas/{id}/aprobar", rentalId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.statusCode").value(409))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("ya tiene otra reserva aprobada")));
    }

    @Test
    @DisplayName("POST /api/reservas/{id}/aprobar retorna 400 BAD REQUEST cuando la reserva ya no está PENDING")
    @WithMockUser(roles = "PROVEEDOR")
    void shouldAprobarReservaReturn400WhenNotPending() throws Exception {
        when(rentalUseCase.aprobarReserva(eq(rentalId), any()))
                .thenThrow(new BusinessRuleViolationException("Solo se pueden aprobar reservas PENDIENTES (estado actual: CONFIRMED)."));
        when(rentalUseCase.aprobarReserva(rentalId))
                .thenThrow(new BusinessRuleViolationException("Solo se pueden aprobar reservas PENDIENTES (estado actual: CONFIRMED)."));

        mockMvc.perform(post("/api/reservas/{id}/aprobar", rentalId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Solo se pueden aprobar reservas PENDIENTES")));
    }

    @Test
    @DisplayName("POST /api/reservas/{id}/rechazar retorna 200 OK y motivo de rechazo en response")
    @WithMockUser(roles = "PROVEEDOR")
    void shouldRechazarReservaWithReasonReturn200() throws Exception {
        String motivo = "Equipo en mantenimiento preventivo";
        when(rentalUseCase.rechazarReserva(eq(rentalId), eq(motivo), any()))
                .thenReturn(buildMockResponse("REJECTED", motivo));
        when(rentalUseCase.rechazarReserva(rentalId, motivo))
                .thenReturn(buildMockResponse("REJECTED", motivo));

        RejectRentalRequest request = new RejectRentalRequest(motivo);

        mockMvc.perform(post("/api/reservas/{id}/rechazar", rentalId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value(motivo));
    }

    @Test
    @DisplayName("GET /api/reservas/{id}/historial retorna 200 OK y la lista de trazabilidad")
    @WithMockUser(roles = "PROVEEDOR")
    void shouldGetRentalHistoryReturn200() throws Exception {
        when(guard.isProviderOfRental(eq(rentalId), any())).thenReturn(true);

        RentalStatusHistoryResponse history1 = new RentalStatusHistoryResponse(
                UUID.randomUUID(), rentalId, null, "PENDING", "CLIENT", LocalDateTime.now(), "Creación de reserva"
        );
        RentalStatusHistoryResponse history2 = new RentalStatusHistoryResponse(
                UUID.randomUUID(), rentalId, "PENDING", "CONFIRMED", "SYSTEM", LocalDateTime.now(), "Reserva aprobada"
        );
        when(rentalUseCase.getRentalHistory(rentalId)).thenReturn(List.of(history1, history2));

        mockMvc.perform(get("/api/reservas/{id}/historial", rentalId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].toStatus").value("CONFIRMED"));
    }

    @Test
    @DisplayName("GET /api/v1/tools/{id}/calendar retorna 200 OK y rangos ocupados a 365 días")
    void shouldGetToolCalendarReturn200() throws Exception {
        ToolAvailabilityResponse response = new ToolAvailabilityResponse(
                toolId,
                "Martillo Demoledor",
                true,
                "AVAILABLE",
                1,
                1,
                0,
                List.of(toolId),
                LocalDate.now(),
                LocalDate.now().plusDays(365),
                Collections.emptyList(),
                "Stock completo disponible"
        );
        when(rentalUseCase.checkToolAvailability(eq(toolId), any(), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/tools/{id}/calendar", toolId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.toolId").value(toolId.toString()))
                .andExpect(jsonPath("$.currentStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.isAvailable").value(true));
    }

    @Test
    @DisplayName("Petición sin autenticación a POST /api/reservas/{id}/aprobar debe responder 401 Unauthorized")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        mockMvc.perform(post("/api/reservas/{id}/aprobar", rentalId))
                .andExpect(status().isUnauthorized());
    }
}
