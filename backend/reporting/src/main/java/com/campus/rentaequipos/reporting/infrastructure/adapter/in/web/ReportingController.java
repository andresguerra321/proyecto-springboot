package com.campus.rentaequipos.reporting.infrastructure.adapter.in.web;

import com.campus.rentaequipos.reporting.application.usecase.ReportingUseCase;
import com.campus.rentaequipos.reporting.domain.model.FrequentClientReport;
import com.campus.rentaequipos.reporting.domain.model.IncomeReport;
import com.campus.rentaequipos.reporting.domain.model.MostRentedToolReport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reporting")
@Tag(name = "Reporting", description = "Reporting and Analytics APIs")
@SecurityRequirement(name = "bearerAuth")
public class ReportingController {

    private final ReportingUseCase reportingUseCase;

    public ReportingController(ReportingUseCase reportingUseCase) {
        this.reportingUseCase = reportingUseCase;
    }

    @GetMapping("/income")
    @Operation(summary = "Get income report", description = "Retrieves total income from completed payments")
    public ResponseEntity<IncomeReport> getIncomeReport() {
        return ResponseEntity.ok(reportingUseCase.getIncomeReport());
    }

    @GetMapping("/most-rented-tools")
    @Operation(summary = "Get most rented tools", description = "Retrieves top rented tools")
    public ResponseEntity<List<MostRentedToolReport>> getMostRentedTools(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(reportingUseCase.getMostRentedTools(limit));
    }

    @GetMapping("/frequent-clients")
    @Operation(summary = "Get frequent clients", description = "Retrieves top clients with most rentals")
    public ResponseEntity<List<FrequentClientReport>> getFrequentClients(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(reportingUseCase.getFrequentClients(limit));
    }

    @GetMapping("/tool-availability")
    @Operation(summary = "Get tool availability report", description = "Retrieves stock status metrics: available, rented, maintenance, and retired tools")
    public ResponseEntity<com.campus.rentaequipos.reporting.domain.model.ToolAvailabilityReport> getToolAvailabilityReport() {
        return ResponseEntity.ok(reportingUseCase.getToolAvailabilityReport());
    }

    @GetMapping("/provider/{providerId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'PROVEEDOR')")
    @Operation(summary = "Métricas y KPIs del dashboard de proveedor", description = "Calcula los KPIs clave del proveedor: total herramientas, herramientas en renta, averías, ganancias acumuladas y solicitudes de alquiler pendientes")
    public ResponseEntity<com.campus.rentaequipos.reporting.domain.model.ProviderDashboardReport> getProviderDashboardReport(
            @PathVariable java.util.UUID providerId) {
        return ResponseEntity.ok(reportingUseCase.getProviderDashboardReport(providerId));
    }

    @GetMapping("/overdue")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Alquileres vencidos", description = "Alquileres IN_PROGRESS con fecha fin pasada, días de mora y recargo estimado (×1.5)")
    public ResponseEntity<List<com.campus.rentaequipos.reporting.domain.model.OverdueRentalReport>> getOverdueRentals() {
        return ResponseEntity.ok(reportingUseCase.getOverdueRentals());
    }

    @GetMapping("/damages-summary")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Siniestralidad por categoría", description = "Número de daños, pérdidas totales y costos de reparación agrupados por categoría")
    public ResponseEntity<List<com.campus.rentaequipos.reporting.domain.model.DamageSummaryReport>> getDamageSummary() {
        return ResponseEntity.ok(reportingUseCase.getDamageSummaryByCategory());
    }
}
