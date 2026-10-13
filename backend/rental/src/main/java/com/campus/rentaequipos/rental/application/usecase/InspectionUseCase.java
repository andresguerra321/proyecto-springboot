package com.campus.rentaequipos.rental.application.usecase;

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
import com.campus.rentaequipos.rental.domain.model.RentalStatus;
import com.campus.rentaequipos.rental.domain.repository.DamageReportRepository;
import com.campus.rentaequipos.rental.domain.repository.RentalInspectionRepository;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
import com.campus.rentaequipos.shared.domain.exception.EntityNotFoundException;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InspectionUseCase {

    private final RentalInspectionRepository rentalInspectionRepository;
    private final DamageReportRepository damageReportRepository;
    private final RentalRepository rentalRepository;
    private final ToolRepository toolRepository;

    public InspectionUseCase(RentalInspectionRepository rentalInspectionRepository,
                             DamageReportRepository damageReportRepository,
                             RentalRepository rentalRepository,
                             ToolRepository toolRepository) {
        this.rentalInspectionRepository = rentalInspectionRepository;
        this.damageReportRepository = damageReportRepository;
        this.rentalRepository = rentalRepository;
        this.toolRepository = toolRepository;
    }

    @Transactional
    public InspectionResponse createInspection(InspectionRequest request) {
        Rental rental = rentalRepository.findById(request.rentalId())
                .orElseThrow(() -> new EntityNotFoundException("Rental", request.rentalId()));

        RentalInspection inspection = new RentalInspection(
                UUID.randomUUID(),
                request.rentalId(),
                request.inspectionType(),
                LocalDateTime.now(),
                request.inspectorNotes(),
                request.inspectorUserId(),
                request.status()
        );

        RentalInspection saved = rentalInspectionRepository.save(inspection);

        // Lifecycle transitions based on inspection type
        if ("DELIVERY".equalsIgnoreCase(request.inspectionType())) {
            if (rental.getStatus() == RentalStatus.CONFIRMED || rental.getStatus() == RentalStatus.PENDING) {
                rental.start();
                rentalRepository.save(rental);
            }
        } else if ("RETURN".equalsIgnoreCase(request.inspectionType())) {
            if (!"DAMAGED".equalsIgnoreCase(request.status())) {
                rental.complete();
                rentalRepository.save(rental);
                for (RentalItem item : rental.getItems()) {
                    toolRepository.findById(item.getToolId()).ifPresent(tool -> {
                        tool.updateStatus(ToolStatus.AVAILABLE);
                        toolRepository.save(tool);
                    });
                }
            }
        }

        return mapToInspectionResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<InspectionResponse> getInspectionsByRental(UUID rentalId) {
        return rentalInspectionRepository.findByRentalId(rentalId).stream()
                .map(this::mapToInspectionResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InspectionResponse getInspectionById(UUID id) {
        RentalInspection inspection = rentalInspectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("RentalInspection", id));
        return mapToInspectionResponse(inspection);
    }

    @Transactional
    public DamageReportResponse createDamageReport(UUID inspectionId, DamageReportRequest request) {
        RentalInspection inspection = rentalInspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new EntityNotFoundException("RentalInspection", inspectionId));

        Tool tool = toolRepository.findById(request.toolId())
                .orElseThrow(() -> new EntityNotFoundException("Tool", request.toolId()));

        // Update tool status according to damage severity
        if ("TOTAL_LOSS".equalsIgnoreCase(request.severity())) {
            tool.updateStatus(ToolStatus.RETIRED);
        } else {
            tool.updateStatus(ToolStatus.MAINTENANCE);
        }
        toolRepository.save(tool);

        DamageReport damageReport = new DamageReport(
                UUID.randomUUID(),
                inspection.getId(),
                tool.getId(),
                request.severity(),
                request.description(),
                Money.of(request.repairCost()),
                request.isChargedToClient()
        );

        DamageReport saved = damageReportRepository.save(damageReport);
        return mapToDamageResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DamageReportResponse> getDamagesByInspection(UUID inspectionId) {
        return damageReportRepository.findByInspectionId(inspectionId).stream()
                .map(this::mapToDamageResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DamageReportResponse> getAllDamages() {
        return damageReportRepository.findAll().stream()
                .map(this::mapToDamageResponse)
                .collect(Collectors.toList());
    }

    private InspectionResponse mapToInspectionResponse(RentalInspection entity) {
        return new InspectionResponse(
                entity.getId(),
                entity.getRentalId(),
                entity.getInspectionType(),
                entity.getInspectionDate(),
                entity.getInspectorNotes(),
                entity.getInspectorUserId(),
                entity.getStatus()
        );
    }

    private DamageReportResponse mapToDamageResponse(DamageReport report) {
        return new DamageReportResponse(
                report.getId(),
                report.getInspectionId(),
                report.getToolId(),
                report.getSeverity(),
                report.getDescription(),
                report.getRepairCost().getAmount(),
                report.isChargedToClient()
        );
    }
}
