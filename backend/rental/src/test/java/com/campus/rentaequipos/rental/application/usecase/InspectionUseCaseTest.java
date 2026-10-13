package com.campus.rentaequipos.rental.application.usecase;

import com.campus.rentaequipos.catalog.domain.model.Category;
import com.campus.rentaequipos.catalog.domain.model.Tool;
import com.campus.rentaequipos.catalog.domain.model.ToolStatus;
import com.campus.rentaequipos.catalog.domain.repository.ToolRepository;
import com.campus.rentaequipos.rental.application.dto.DamageReportRequest;
import com.campus.rentaequipos.rental.application.dto.DamageReportResponse;
import com.campus.rentaequipos.rental.application.dto.InspectionRequest;
import com.campus.rentaequipos.rental.application.dto.InspectionResponse;
import com.campus.rentaequipos.rental.domain.model.DamageReport;
import com.campus.rentaequipos.rental.domain.model.Rental;
import com.campus.rentaequipos.rental.domain.model.RentalInspection;
import com.campus.rentaequipos.rental.domain.model.RentalItem;
import com.campus.rentaequipos.rental.domain.model.RentalItemStatus;
import com.campus.rentaequipos.rental.domain.model.RentalStatus;
import com.campus.rentaequipos.rental.domain.repository.DamageReportRepository;
import com.campus.rentaequipos.rental.domain.repository.RentalInspectionRepository;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
import com.campus.rentaequipos.shared.domain.valueobject.DateRange;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InspectionUseCase Unit Tests")
class InspectionUseCaseTest {

    @Mock
    private RentalInspectionRepository rentalInspectionRepository;

    @Mock
    private DamageReportRepository damageReportRepository;

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private ToolRepository toolRepository;

    private InspectionUseCase inspectionUseCase;

    private UUID rentalId;
    private UUID toolId;
    private Tool testTool;
    private Rental testRental;

    @BeforeEach
    void setUp() {
        inspectionUseCase = new InspectionUseCase(
                rentalInspectionRepository,
                damageReportRepository,
                rentalRepository,
                toolRepository
        );
        rentalId = UUID.randomUUID();
        toolId = UUID.randomUUID();

        testTool = new Tool(
                toolId,
                UUID.randomUUID(),
                new Category(UUID.randomUUID(), "Corte", "Equipos de corte"),
                "Rotomartillo SDS",
                "Bosch",
                "GBH 2-28",
                "SN-9900",
                "Rotomartillo electroneumático",
                Money.of(35.00),
                Money.of(300.00),
                ToolStatus.RENTED,
                Collections.emptyList(),
                Collections.emptyList()
        );

        RentalItem item = new RentalItem(
                UUID.randomUUID(),
                toolId,
                Money.of(35.00),
                Money.of(105.00),
                RentalItemStatus.RESERVED
        );

        testRental = new Rental(
                rentalId,
                "RNT-INSP123",
                UUID.randomUUID(),
                DateRange.of(LocalDate.now(), LocalDate.now().plusDays(3)),
                3,
                Money.of(105.00),
                Money.of(30.00),
                Money.of(135.00),
                RentalStatus.CONFIRMED,
                List.of(item)
        );
    }

    @Test
    @DisplayName("Debe registrar inspección de entrega (DELIVERY) y cambiar estado del alquiler a IN_PROGRESS")
    void shouldCreateDeliveryInspectionAndStartRental() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));
        when(rentalInspectionRepository.save(any(RentalInspection.class))).thenAnswer(i -> i.getArgument(0));

        InspectionRequest request = new InspectionRequest(
                rentalId,
                "DELIVERY",
                "Herramienta entregada en óptimas condiciones con cables completos",
                UUID.randomUUID(),
                "PASSED"
        );

        InspectionResponse response = inspectionUseCase.createInspection(request);

        assertNotNull(response);
        assertEquals("DELIVERY", response.inspectionType());
        assertEquals(RentalStatus.IN_PROGRESS, testRental.getStatus());
        verify(rentalRepository).save(testRental);
    }

    @Test
    @DisplayName("Debe registrar inspección de retorno (RETURN) y liberar la herramienta a AVAILABLE")
    void shouldCreateReturnInspectionAndCompleteRental() {
        testRental.start(); // Set to IN_PROGRESS
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(testRental));
        when(rentalInspectionRepository.save(any(RentalInspection.class))).thenAnswer(i -> i.getArgument(0));
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(testTool));

        InspectionRequest request = new InspectionRequest(
                rentalId,
                "RETURN",
                "Herramienta retornada limpia y funcionando",
                UUID.randomUUID(),
                "PASSED"
        );

        InspectionResponse response = inspectionUseCase.createInspection(request);

        assertNotNull(response);
        assertEquals("RETURN", response.inspectionType());
        assertEquals(RentalStatus.COMPLETED, testRental.getStatus());
        assertEquals(ToolStatus.AVAILABLE, testTool.getStatus());
        verify(toolRepository).save(testTool);
    }

    @Test
    @DisplayName("Debe registrar reporte de daño y cambiar estado de la herramienta a MAINTENANCE")
    void shouldCreateDamageReportAndUpdateToolStatus() {
        UUID inspectionId = UUID.randomUUID();
        RentalInspection inspection = new RentalInspection(
                inspectionId,
                rentalId,
                "RETURN",
                LocalDateTime.now(),
                "Presenta fisura en la carcasa plástica",
                UUID.randomUUID(),
                "DAMAGED"
        );

        when(rentalInspectionRepository.findById(inspectionId)).thenReturn(Optional.of(inspection));
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(testTool));
        when(damageReportRepository.save(any(DamageReport.class))).thenAnswer(i -> i.getArgument(0));

        DamageReportRequest request = new DamageReportRequest(
                inspectionId,
                toolId,
                "MODERATE",
                "Fisura en carcasa por impacto",
                new BigDecimal("45.00"),
                true
        );

        DamageReportResponse response = inspectionUseCase.createDamageReport(inspectionId, request);

        assertNotNull(response);
        assertEquals("MODERATE", response.severity());
        assertEquals(ToolStatus.MAINTENANCE, testTool.getStatus());
        verify(toolRepository).save(testTool);
        verify(damageReportRepository).save(any(DamageReport.class));
    }
}
