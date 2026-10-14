package com.campus.rentaequipos.rental.application.usecase;

import com.campus.rentaequipos.catalog.domain.model.Category;
import com.campus.rentaequipos.catalog.domain.model.Tool;
import com.campus.rentaequipos.catalog.domain.model.ToolStatus;
import com.campus.rentaequipos.catalog.domain.repository.ToolRepository;
import com.campus.rentaequipos.rental.application.dto.RentalRequest;
import com.campus.rentaequipos.rental.application.dto.RentalResponse;
import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
import com.campus.rentaequipos.rental.domain.model.Rental;
import com.campus.rentaequipos.rental.domain.model.RentalItem;
import com.campus.rentaequipos.rental.domain.model.RentalItemStatus;
import com.campus.rentaequipos.rental.domain.model.RentalStatus;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
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

    private RentalUseCase rentalUseCase;

    private UUID rentalId;
    private UUID toolId;
    private Tool testTool;
    private Rental testRental;

    @BeforeEach
    void setUp() {
        rentalUseCase = new RentalUseCase(rentalRepository, toolRepository);
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
}
