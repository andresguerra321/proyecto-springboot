package com.campus.rentaequipos.rental.application.usecase;

import com.campus.rentaequipos.catalog.domain.model.Tool;
import com.campus.rentaequipos.catalog.domain.repository.ToolRepository;
import com.campus.rentaequipos.rental.application.dto.UpdateClaimStatusRequest;
import com.campus.rentaequipos.rental.application.dto.WarrantyClaimRequest;
import com.campus.rentaequipos.rental.application.dto.WarrantyClaimResponse;
import com.campus.rentaequipos.rental.domain.model.Rental;
import com.campus.rentaequipos.rental.domain.model.WarrantyClaim;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
import com.campus.rentaequipos.rental.domain.repository.WarrantyClaimRepository;
import com.campus.rentaequipos.shared.domain.exception.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WarrantyClaimUseCase {

    private final WarrantyClaimRepository warrantyClaimRepository;
    private final RentalRepository rentalRepository;
    private final ToolRepository toolRepository;

    public WarrantyClaimUseCase(WarrantyClaimRepository warrantyClaimRepository,
                                RentalRepository rentalRepository,
                                ToolRepository toolRepository) {
        this.warrantyClaimRepository = warrantyClaimRepository;
        this.rentalRepository = rentalRepository;
        this.toolRepository = toolRepository;
    }

    @Transactional
    public WarrantyClaimResponse createClaim(UUID rentalId, WarrantyClaimRequest request) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new EntityNotFoundException("Rental", rentalId));

        UUID toolId = request.toolId();
        if (toolId == null && !rental.getItems().isEmpty()) {
            toolId = rental.getItems().get(0).getToolId();
        }

        String ticketNumber = "GAR-2026-" + ((int) (1000 + Math.random() * 9000));

        WarrantyClaim claim = new WarrantyClaim(
                UUID.randomUUID(),
                ticketNumber,
                rental.getId(),
                toolId,
                request.claimType() != null ? request.claimType() : "EXCHANGE",
                request.faultType() != null ? request.faultType() : "MOTOR",
                request.urgency() != null ? request.urgency() : "NORMAL",
                request.description(),
                request.contactPhone(),
                request.deliveryAddress(),
                "OPEN",
                null,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        return mapToResponse(saved, rental);
    }

    @Transactional(readOnly = true)
    public List<WarrantyClaimResponse> getClaimsByRental(UUID rentalId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new EntityNotFoundException("Rental", rentalId));
        return warrantyClaimRepository.findByRentalId(rentalId).stream()
                .map(c -> mapToResponse(c, rental))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WarrantyClaimResponse> getClaimsByProvider(UUID providerId) {
        return warrantyClaimRepository.findByProviderId(providerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WarrantyClaimResponse getClaimById(UUID id) {
        WarrantyClaim claim = warrantyClaimRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("WarrantyClaim", id));
        return mapToResponse(claim);
    }

    @Transactional
    public WarrantyClaimResponse updateClaimStatus(UUID id, UpdateClaimStatusRequest request) {
        WarrantyClaim claim = warrantyClaimRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("WarrantyClaim", id));

        claim.updateStatus(request.status(), request.notes());
        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        return mapToResponse(saved);
    }

    private WarrantyClaimResponse mapToResponse(WarrantyClaim claim) {
        Rental rental = rentalRepository.findById(claim.getRentalId()).orElse(null);
        return mapToResponse(claim, rental);
    }

    private WarrantyClaimResponse mapToResponse(WarrantyClaim claim, Rental rental) {
        String rentalCode = rental != null ? rental.getRentalCode() : null;
        String toolName = null;
        if (claim.getToolId() != null) {
            toolName = toolRepository.findById(claim.getToolId())
                    .map(Tool::getName)
                    .orElse(null);
        }

        return new WarrantyClaimResponse(
                claim.getId(),
                claim.getTicketNumber(),
                claim.getRentalId(),
                rentalCode,
                claim.getToolId(),
                toolName,
                claim.getClaimType(),
                claim.getFaultType(),
                claim.getUrgency(),
                claim.getDescription(),
                claim.getContactPhone(),
                claim.getDeliveryAddress(),
                claim.getStatus(),
                claim.getResolutionNotes(),
                claim.getCreatedAt(),
                claim.getUpdatedAt()
        );
    }
}
