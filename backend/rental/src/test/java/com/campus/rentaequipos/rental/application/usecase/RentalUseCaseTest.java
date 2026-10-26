package com.campus.rentaequipos.rental.application.usecase;

import com.campus.rentaequipos.catalog.domain.model.Category;
import com.campus.rentaequipos.catalog.domain.model.Tool;
import com.campus.rentaequipos.catalog.domain.model.ToolStatus;
import com.campus.rentaequipos.catalog.domain.repository.ToolRepository;
import com.campus.rentaequipos.rental.application.dto.RentalRequest;
import com.campus.rentaequipos.rental.application.dto.RentalResponse;
import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
import com.campus.rentaequipos.shared.domain.exception.HerramientaNoDisponibleException;
import com.campus.rentaequipos.rental.domain.model.Rental;
import com.campus.rentaequipos.rental.domain.model.RentalItem;
import com.campus.rentaequipos.rental.domain.model.RentalItemStatus;
import com.campus.rentaequipos.rental.domain.model.RentalStatus;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
import com.campus.rentaequipos.rental.domain.repository.RentalStatusHistoryRepository;
import com.campus.rentaequipos.shared.domain.valueobject.DateRange;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RentalUseCase Unit Tests")
class RentalUseCaseTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private ToolRepository toolRepository;

    @Mock
    private RentalStatusHistoryRepository statusHistoryRepository;

    private RentalUseCase rentalUseCase;

    private UUID rentalId;
    private UUID toolId;
    private Tool testTool;
    private Rental testRental;

    @BeforeEach
    void setUp() {
        rentalUseCase = new RentalUseCase(rentalRepository, toolRepository, statusHistoryRepository);
        rentalId = UUID.randomUUID();
        toolId = UUID.randomUUID();

        testTool = new Tool(
                toolId,
                UUID.randomUUID(),
                new Category(UUID.randomUUID(), "Corte", "Equipos de corte"),
                "Sierra Circular",
                "Makita",
                "5007N",
                "SN-7788",
                "Sierra circular 1800W",
                Money.of(20.00),
                Money.of(180.00),
                ToolStatus.RENTED,
                Collections.emptyList(),
                Collections.emptyList()
        );

        RentalItem item = new RentalItem(
                UUID.randomUUID(),
                toolId,
                Money.of(20.00),
                Money.of(60.00),
                RentalItemStatus.RESERVED
        );

        testRental = new Rental(
                rentalId,
                "RNT-TEST123",
                UUID.randomUUID(),
                DateRange.of(LocalDate.now(), LocalDate.now().plusDays(3)),
                3,
                Money.of(60.00),
                Money.of(18.00),
                Money.of(78.00),
                RentalStatus.PENDING,
                List.of(item)
        );
    }

    @Test
    @DisplayName("Debe lanzar excepción si la herramienta no está disponible por mantenimiento")
    void shouldThrowWhenToolNotAvailable() {
        UUID providerId = UUID.randomUUID();
        Category category = new Category(UUID.randomUUID(), "Taladro", "Herramientas de perforación");
        Tool unavailableTool = new Tool(
                toolId,
                providerId,
                category,
                "Taladro",
                "DeWalt",
                "D1",
                "SN-TEST-4455",
                "Desc",
                Money.of(50.00),
                Money.of(100.00),
                ToolStatus.MAINTENANCE,
                Collections.emptyList(),
                Collections.emptyList()
        );

        when(toolRepository.findById(toolId)).thenReturn(Optional.of(unavailableTool));

        RentalRequest request = new RentalRequest(
                UUID.randomUUID(),
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(3),
                List.of(toolId)
        );

        assertThrows(BusinessRuleViolationException.class, () -> rentalUseCase.createRental(request));
    }

    @Test
    @DisplayName("Debe confirmar una reserva en estado PENDING")
    void shouldConfirmPendingRental() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));
        when(rentalRepository.findAll()).thenReturn(List.of(testRental));
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(testTool));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));

        RentalResponse response = rentalUseCase.confirmRental(rentalId);

        assertNotNull(response);
        assertEquals(RentalStatus.CONFIRMED.name(), response.status());
        verify(rentalRepository).save(any(Rental.class));
    }

    @Test
    @DisplayName("Debe cancelar una reserva y liberar la herramienta a AVAILABLE")
    void shouldCancelRentalAndReleaseTools() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(testTool));

        RentalResponse response = rentalUseCase.cancelRental(rentalId);

        assertNotNull(response);
        assertEquals(RentalStatus.CANCELLED.name(), response.status());
        assertEquals(ToolStatus.AVAILABLE, testTool.getStatus());
        verify(toolRepository).save(testTool);
    }

    @Test
    @DisplayName("Debe detectar solapamiento de fechas al verificar disponibilidad")
    void shouldDetectDateOverlapWhenCheckingAvailability() {
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(testTool));
        when(rentalRepository.findAll()).thenReturn(List.of(testRental));

        LocalDate queryStart = LocalDate.now().plusDays(1);
        LocalDate queryEnd = LocalDate.now().plusDays(2);

        com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse response =
                rentalUseCase.checkToolAvailability(toolId, queryStart, queryEnd);

        assertNotNull(response);
        assertFalse(response.isAvailable());
        assertEquals(1, response.bookedDateRanges().size());
    }

    @Test
    @DisplayName("Debe listar las solicitudes y alquileres de un proveedor")
    void shouldGetProviderRentals() {
        UUID providerId = UUID.randomUUID();
        when(toolRepository.findByProviderId(providerId)).thenReturn(List.of(testTool));
        when(rentalRepository.findAll()).thenReturn(List.of(testRental));

        List<RentalResponse> rentals = rentalUseCase.getProviderRentals(providerId);

        assertNotNull(rentals);
        assertEquals(1, rentals.size());
        assertEquals("RNT-TEST123", rentals.get(0).rentalCode());
    }

    @Test
    @DisplayName("Debe aprobar exitosamente una reserva PENDING verificando disponibilidad de herramienta")
    void shouldAprobarReservaSuccessfully() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));
        when(rentalRepository.findAll()).thenReturn(List.of(testRental));
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(testTool));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));

        RentalResponse response = rentalUseCase.aprobarReserva(rentalId);

        assertNotNull(response);
        assertEquals(RentalStatus.CONFIRMED.name(), response.status());
        verify(rentalRepository).save(any(Rental.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción al aprobar si la herramienta entra en mantenimiento")
    void shouldThrowWhenAprobarReservaAndToolInMaintenance() {
        Tool maintenanceTool = new Tool(
                toolId,
                UUID.randomUUID(),
                new Category(UUID.randomUUID(), "Corte", "Corte"),
                "Sierra",
                "Makita",
                "M1",
                "SN-1",
                "Desc",
                Money.of(20.0),
                Money.of(100.0),
                ToolStatus.MAINTENANCE,
                Collections.emptyList(),
                Collections.emptyList()
        );

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));
        when(rentalRepository.findAll()).thenReturn(List.of(testRental));
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(maintenanceTool));

        assertThrows(HerramientaNoDisponibleException.class, () -> rentalUseCase.aprobarReserva(rentalId));
    }

    @Test
    @DisplayName("Debe rechazar exitosamente una reserva PENDING cambiando estado a REJECTED")
    void shouldRechazarReservaSuccessfully() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));

        RentalResponse response = rentalUseCase.rechazarReserva(rentalId);

        assertNotNull(response);
        assertEquals(RentalStatus.REJECTED.name(), response.status());
        verify(rentalRepository).save(any(Rental.class));
    }

    @Test
    @DisplayName("Debe permitir filtrar alquileres por proveedor con searchRentals")
    void shouldFilterRentalsByProvider() {
        UUID providerId = UUID.randomUUID();
        when(toolRepository.findByProviderId(providerId)).thenReturn(List.of(testTool));
        when(rentalRepository.findAll()).thenReturn(List.of(testRental));

        List<RentalResponse> rentals = rentalUseCase.searchRentals("PENDING", null, null, providerId);

        assertNotNull(rentals);
        assertEquals(1, rentals.size());
    }

    @Test
    @DisplayName("Debe rechazar cancelacion de cliente si falta menos de 24h para inicio")
    void shouldThrowWhenClientCancelsLessThan24hBeforeStart() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));

        assertThrows(BusinessRuleViolationException.class, () -> rentalUseCase.cancelRental(rentalId, true));
    }

    @Test
    @DisplayName("Debe permitir cancelacion de cliente si falta mas de 24h para inicio")
    void shouldAllowClientCancelWhenMoreThan24hBeforeStart() {
        Rental futureRental = new Rental(
                rentalId,
                "RNT-FUT123",
                UUID.randomUUID(),
                DateRange.of(LocalDate.now().plusDays(5), LocalDate.now().plusDays(8)),
                3,
                Money.of(60.00),
                Money.of(18.00),
                Money.of(78.00),
                RentalStatus.PENDING,
                testRental.getItems()
        );
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(futureRental));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));

        RentalResponse response = rentalUseCase.cancelRental(rentalId, true);

        assertNotNull(response);
        assertEquals(RentalStatus.CANCELLED.name(), response.status());
    }

    @Test
    @DisplayName("Debe sumar recargo por mora si la devolucion se hace despues de la fecha fin")
    void shouldCalculateLateFeeAndAddToTotalWhenOverdueOnComplete() {
        Rental inProgressOverdueRental = new Rental(
                rentalId,
                "RNT-OVERDUE",
                UUID.randomUUID(),
                DateRange.of(LocalDate.now().minusDays(5), LocalDate.now().minusDays(2)),
                3,
                Money.of(60.00),
                Money.of(18.00),
                Money.of(78.00),
                RentalStatus.IN_PROGRESS,
                testRental.getItems()
        );
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(inProgressOverdueRental));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));
        when(toolRepository.findById(any())).thenReturn(Optional.of(testTool));

        RentalResponse response = rentalUseCase.completeRental(rentalId);

        assertNotNull(response);
        assertEquals(RentalStatus.COMPLETED.name(), response.status());
        // 2 días de mora * $20 * 1.5 = $60 recargo por mora. Total: 78 + 60 = 138
        assertTrue(response.totalAmount().compareTo(java.math.BigDecimal.valueOf(78.00)) > 0);
    }

    @Test
    @DisplayName("Debe retornar resumen de alquileres e ingresos de un proveedor")
    void shouldReturnProviderRentalSummary() {
        UUID providerId = UUID.randomUUID();
        when(toolRepository.findByProviderId(providerId)).thenReturn(List.of(testTool));

        Rental completedRental = new Rental(
                UUID.randomUUID(),
                "RNT-COMP1",
                UUID.randomUUID(),
                DateRange.of(LocalDate.now().minusDays(10), LocalDate.now().minusDays(7)),
                3,
                Money.of(100.00),
                Money.of(20.00),
                Money.of(120.00),
                RentalStatus.COMPLETED,
                testRental.getItems()
        );
        when(rentalRepository.findAll()).thenReturn(List.of(testRental, completedRental));

        var summary = rentalUseCase.getProviderSummary(providerId);

        assertNotNull(summary);
        assertEquals(2, summary.totalRentals());
        assertEquals(1, summary.countByStatus().get("PENDING"));
        assertEquals(1, summary.countByStatus().get("COMPLETED"));
        assertEquals(0, java.math.BigDecimal.valueOf(100.00).compareTo(summary.totalCompletedIncome()));
    }

    @Test
    @DisplayName("Debe lanzar excepción si se intenta aprobar una reserva que ya no está PENDING")
    void shouldThrowWhenAprobarReservaAlreadyConfirmed() {
        testRental.confirm();
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));

        assertThrows(BusinessRuleViolationException.class, () -> rentalUseCase.aprobarReserva(rentalId));
    }

    @Test
    @DisplayName("Debe lanzar excepción si se intenta rechazar una reserva que no está PENDING")
    void shouldThrowWhenRechazarReservaNotPending() {
        testRental.confirm();
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));

        assertThrows(BusinessRuleViolationException.class, () -> rentalUseCase.rechazarReserva(rentalId));
    }

    @Test
    @DisplayName("Debe lanzar HerramientaNoDisponibleException al aprobar si hay cruce con otra reserva CONFIRMED")
    void shouldThrowWhenAprobarReservaHasDateOverlapWithConfirmedRental() {
        Rental confirmedOverlap = new Rental(
                UUID.randomUUID(),
                "RNT-CONF1",
                UUID.randomUUID(),
                testRental.getDateRange(),
                testRental.getTotalDays(),
                testRental.getSubtotal(),
                testRental.getDeposit(),
                testRental.getTotalAmount(),
                RentalStatus.CONFIRMED,
                testRental.getItems()
        );

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));
        when(rentalRepository.findAll()).thenReturn(List.of(testRental, confirmedOverlap));
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(testTool));

        assertThrows(HerramientaNoDisponibleException.class, () -> rentalUseCase.aprobarReserva(rentalId));
    }

    @Test
    @DisplayName("Debe auto-rechazar reservas PENDING en conflicto cuando se aprueba una reserva")
    void shouldAutoRejectConflictingPendingRentalsWhenApproved() {
        UUID otherRentalId = UUID.randomUUID();
        Rental competingPending = new Rental(
                otherRentalId,
                "RNT-COMPETE",
                UUID.randomUUID(),
                testRental.getDateRange(),
                testRental.getTotalDays(),
                testRental.getSubtotal(),
                testRental.getDeposit(),
                testRental.getTotalAmount(),
                RentalStatus.PENDING,
                testRental.getItems()
        );

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));
        when(rentalRepository.findAll()).thenReturn(List.of(testRental, competingPending));
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(testTool));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));

        RentalResponse response = rentalUseCase.aprobarReserva(rentalId);

        assertNotNull(response);
        assertEquals(RentalStatus.CONFIRMED.name(), response.status());
        assertEquals(RentalStatus.REJECTED, competingPending.getStatus());
        assertTrue(competingPending.getRejectionReason().contains("conflicto de fechas"));
    }

    @Test
    @DisplayName("Debe rechazar reserva guardando el motivo de rechazo")
    void shouldRechazarReservaWithReason() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(i -> i.getArgument(0));

        String motivo = "Equipo no disponible para la zona solicitada";
        RentalResponse response = rentalUseCase.rechazarReserva(rentalId, motivo);

        assertNotNull(response);
        assertEquals(RentalStatus.REJECTED.name(), response.status());
        assertEquals(motivo, response.rejectionReason());
        verify(rentalRepository).save(any(Rental.class));
        verify(statusHistoryRepository).save(argThat(h ->
                "REJECTED".equals(h.getToStatus()) && motivo.equals(h.getNotes())
        ));
    }
}
