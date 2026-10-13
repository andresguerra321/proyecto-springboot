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
}
