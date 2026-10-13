package com.campus.rentaequipos.rental.infrastructure.adapter.in.web;

import com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse;
import com.campus.rentaequipos.rental.application.usecase.RentalUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tools")
@Tag(name = "Tool Availability", description = "Verificación de disponibilidad y solapamiento de fechas para herramientas")
public class ToolAvailabilityController {

    private final RentalUseCase rentalUseCase;

    public ToolAvailabilityController(RentalUseCase rentalUseCase) {
        this.rentalUseCase = rentalUseCase;
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "Consultar disponibilidad de herramienta por fechas",
               description = "Evalúa si una herramienta está disponible para un rango de fechas y devuelve las fechas ya reservadas para deshabilitar en el selector de fechas")
    public ResponseEntity<ToolAvailabilityResponse> checkAvailability(
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(rentalUseCase.checkToolAvailability(id, from, to));
    }
}
