package com.campus.rentaequipos.rental.infrastructure.adapter.in.web;

import com.campus.rentaequipos.rental.application.dto.DamageReportRequest;
import com.campus.rentaequipos.rental.application.dto.DamageReportResponse;
import com.campus.rentaequipos.rental.application.dto.InspectionRequest;
import com.campus.rentaequipos.rental.application.dto.InspectionResponse;
import com.campus.rentaequipos.rental.application.usecase.InspectionUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inspections")
@Tag(name = "Inspections & Damage Reports", description = "Control de inspecciones físicas en entrega/devolución y registro de daños")
@SecurityRequirement(name = "bearerAuth")
public class InspectionController {

    private final InspectionUseCase inspectionUseCase;

    public InspectionController(InspectionUseCase inspectionUseCase) {
        this.inspectionUseCase = inspectionUseCase;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVEEDOR')")
    @Operation(summary = "Registrar inspección física", description = "Crea un acta de inspección física en entrega (DELIVERY) o devolución (RETURN)")
    public ResponseEntity<InspectionResponse> createInspection(@RequestBody InspectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inspectionUseCase.createInspection(request));
    }

    @GetMapping("/rental/{rentalId}")
    @Operation(summary = "Obtener inspecciones por alquiler", description = "Lista todas las inspecciones realizadas a una reserva/alquiler específico")
    public ResponseEntity<List<InspectionResponse>> getInspectionsByRental(@PathVariable UUID rentalId) {
        return ResponseEntity.ok(inspectionUseCase.getInspectionsByRental(rentalId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener inspección por ID", description = "Consulta los detalles de una inspección técnica específica")
    public ResponseEntity<InspectionResponse> getInspectionById(@PathVariable UUID id) {
        return ResponseEntity.ok(inspectionUseCase.getInspectionById(id));
    }

    @PostMapping("/{id}/damages")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVEEDOR')")
    @Operation(summary = "Reportar daño o avería", description = "Registra una incidencia de daño asociada a la inspección y actualiza el estado de la herramienta")
    public ResponseEntity<DamageReportResponse> createDamageReport(@PathVariable UUID id,
                                                                   @RequestBody DamageReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inspectionUseCase.createDamageReport(id, request));
    }

    @GetMapping("/{id}/damages")
    @Operation(summary = "Obtener daños por inspección", description = "Lista todos los reportes de daños asociados a una inspección")
    public ResponseEntity<List<DamageReportResponse>> getDamagesByInspection(@PathVariable UUID id) {
        return ResponseEntity.ok(inspectionUseCase.getDamagesByInspection(id));
    }

    @GetMapping("/damages")
    @Operation(summary = "Listar todos los daños registrados", description = "Lista global de daños e incidencias de maquinaria en la plataforma")
    public ResponseEntity<List<DamageReportResponse>> getAllDamages() {
        return ResponseEntity.ok(inspectionUseCase.getAllDamages());
    }
}
