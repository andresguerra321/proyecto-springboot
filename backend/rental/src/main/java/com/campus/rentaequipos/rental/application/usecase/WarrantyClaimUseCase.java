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
import com.campus.rentaequipos.rental.domain.model.RentalStatus;
import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
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

        if (rental.getStatus() == RentalStatus.CANCELLED) {
            throw new BusinessRuleViolationException("No es posible radicar reclamos o garantías sobre un contrato de alquiler cancelado.");
        }

        // Validación de reclamaciones existentes: prevenir solicitudes infinitas de reembolso o garantías simultáneas
        List<WarrantyClaim> existingClaims = warrantyClaimRepository.findByRentalId(rentalId);
        boolean hasActiveClaim = existingClaims.stream()
                .anyMatch(c -> !"RESOLVED".equalsIgnoreCase(c.getStatus()) && !"REJECTED".equalsIgnoreCase(c.getStatus()));
        if (hasActiveClaim) {
            String activeTicket = existingClaims.stream()
                    .filter(c -> !"RESOLVED".equalsIgnoreCase(c.getStatus()) && !"REJECTED".equalsIgnoreCase(c.getStatus()))
                    .findFirst().map(WarrantyClaim::getTicketNumber).orElse("en trámite");
            throw new BusinessRuleViolationException("Este contrato de alquiler ya tiene una solicitud activa en trámite (" + activeTicket + "). No se permiten múltiples radicaciones simultáneas.");
        }

        String claimType = request.claimType() != null ? request.claimType().toUpperCase() : "EXCHANGE";
        if ("REFUND".equalsIgnoreCase(claimType)) {
            boolean alreadyRefunded = existingClaims.stream()
                    .anyMatch(c -> "REFUND".equalsIgnoreCase(c.getClaimType()));
            if (alreadyRefunded) {
                throw new BusinessRuleViolationException("Este contrato de alquiler ya cuenta con un trámite de reembolso procesado previamente.");
            }
        }

        UUID toolId = request.toolId();
        if (toolId == null && !rental.getItems().isEmpty()) {
            toolId = rental.getItems().get(0).getToolId();
        } else if (toolId != null && !rental.getItems().isEmpty()) {
            final UUID checkId = toolId;
            boolean belongsToRental = rental.getItems().stream().anyMatch(i -> i.getToolId().equals(checkId));
            if (!belongsToRental) {
                throw new BusinessRuleViolationException("La maquinaria seleccionada no corresponde a los equipos amparados en este contrato de alquiler.");
            }
        }

        String ticketPrefix = "REFUND".equalsIgnoreCase(claimType) ? "RMB-2026-" : "GAR-2026-";
        String ticketNumber = ticketPrefix + ((int) (1000 + Math.random() * 9000));

        String deliveryAddress = (request.deliveryAddress() != null && !request.deliveryAddress().trim().isEmpty())
                ? request.deliveryAddress().trim()
                : (rental.getDeliveryAddress() != null && !rental.getDeliveryAddress().trim().isEmpty()
                        ? rental.getDeliveryAddress().trim()
                        : "Calle 134 # 19-45, Bogotá D.C.");

        String contactPhone = (request.contactPhone() != null && !request.contactPhone().trim().isEmpty())
                ? request.contactPhone().trim()
                : (rental.getContactPhone() != null && !rental.getContactPhone().trim().isEmpty()
                        ? rental.getContactPhone().trim()
                        : "3001234567");

        if ("REFUND".equalsIgnoreCase(claimType) && rental.getStatus() == RentalStatus.PENDING) {
            rental.cancel();
            rentalRepository.save(rental);
        }

        WarrantyClaim claim = new WarrantyClaim(
                UUID.randomUUID(),
                ticketNumber,
                rental.getId(),
                toolId,
                claimType,
                request.faultType() != null ? request.faultType() : ("REFUND".equalsIgnoreCase(claimType) ? "SOLICITUD_REEMBOLSO" : "MOTOR"),
                request.urgency() != null ? request.urgency() : "NORMAL",
                request.description() != null ? request.description() : "Solicitud radicada bajo contrato " + rental.getRentalCode(),
                contactPhone,
                deliveryAddress,
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
