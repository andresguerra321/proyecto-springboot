package com.campus.rentaequipos.rental.application.usecase;

import com.campus.rentaequipos.catalog.domain.model.Tool;
import com.campus.rentaequipos.catalog.domain.model.ToolStatus;
import com.campus.rentaequipos.catalog.domain.repository.ToolRepository;
import com.campus.rentaequipos.rental.application.dto.RentalRequest;
import com.campus.rentaequipos.rental.application.dto.RentalResponse;
import com.campus.rentaequipos.rental.domain.model.Rental;
import com.campus.rentaequipos.rental.domain.model.RentalItem;
import com.campus.rentaequipos.rental.domain.model.RentalItemStatus;
import com.campus.rentaequipos.rental.domain.model.RentalStatus;
import com.campus.rentaequipos.rental.domain.repository.RentalRepository;
import com.campus.rentaequipos.shared.domain.exception.BusinessRuleViolationException;
import com.campus.rentaequipos.shared.domain.exception.EntityNotFoundException;
import com.campus.rentaequipos.shared.domain.valueobject.DateRange;
import com.campus.rentaequipos.shared.domain.valueobject.Money;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RentalUseCase {

    private final RentalRepository rentalRepository;
    private final ToolRepository toolRepository;

    public RentalUseCase(RentalRepository rentalRepository, ToolRepository toolRepository) {
        this.rentalRepository = rentalRepository;
        this.toolRepository = toolRepository;
    }

    @Transactional
    public RentalResponse createRental(RentalRequest request) {
        DateRange dateRange = new DateRange(request.startDate(), request.endDate());
        int totalDays = (int) dateRange.getDays();

        if (totalDays > 30) {
            throw new BusinessRuleViolationException("El período máximo de alquiler permitido es de 30 días (1 mes calendario). Duración solicitada: " + totalDays + " días.");
        }
        if (request.startDate().isBefore(java.time.LocalDate.now())) {
            throw new BusinessRuleViolationException("La fecha de inicio de la reserva no puede ser anterior a la fecha actual.");
        }
        java.time.LocalDate maxBookingHorizon = java.time.LocalDate.now().plusDays(365);
        if (request.startDate().isAfter(maxBookingHorizon) || request.endDate().isAfter(maxBookingHorizon)) {
            throw new BusinessRuleViolationException("No es posible realizar reservas con más de 1 año de anticipación (máximo 365 días a partir de hoy).");
        }
        
        List<Rental> allRentals = rentalRepository.findAll();
        List<Tool> tools = new ArrayList<>();
        for (UUID toolId : request.toolIds()) {
            Tool tool = toolRepository.findById(toolId)
                    .orElseThrow(() -> new EntityNotFoundException("Tool", toolId));
            if (tool.getStatus() == ToolStatus.MAINTENANCE || tool.getStatus() == ToolStatus.RETIRED) {
                throw new BusinessRuleViolationException("La herramienta " + tool.getName() + " se encuentra fuera de servicio (" + tool.getStatus() + ").");
            }
            
            boolean hasOverlap = allRentals.stream()
                    .filter(r -> r.getStatus() == RentalStatus.PENDING || 
                                 r.getStatus() == RentalStatus.CONFIRMED || 
                                 r.getStatus() == RentalStatus.IN_PROGRESS)
                    .filter(r -> r.getItems().stream().anyMatch(item -> item.getToolId().equals(toolId)))
                    .anyMatch(r -> r.getDateRange().overlaps(dateRange));

            if (hasOverlap) {
                throw new BusinessRuleViolationException("La herramienta " + tool.getName() + " ya tiene una reserva activa que se cruza con las fechas seleccionadas.");
            }
            tools.add(tool);
        }

        Money subtotal = Money.ZERO;
        Money deposit = Money.ZERO;
        List<RentalItem> items = new ArrayList<>();

        for (Tool tool : tools) {
            Money dailyPrice = tool.getDailyPrice();
            Money itemTotal = dailyPrice.multiply(totalDays);
            
            subtotal = subtotal.add(itemTotal);
            deposit = deposit.add(tool.getReplacementValue().multiply(new BigDecimal("0.1")));

            RentalItem item = new RentalItem(
                    UUID.randomUUID(),
                    tool.getId(),
                    dailyPrice,
                    itemTotal,
                    RentalItemStatus.RESERVED
            );
            items.add(item);
        }

        Money totalAmount = subtotal.add(deposit);
        String rentalCode = "RNT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Rental rental = new Rental(
                UUID.randomUUID(),
                rentalCode,
                request.clientId(),
                dateRange,
                totalDays,
                subtotal,
                deposit,
                totalAmount,
                RentalStatus.PENDING,
                items
        );

        Rental savedRental = rentalRepository.save(rental);
        return mapToResponse(savedRental);
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getAllRentals() {
        return rentalRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getClientRentals(UUID clientId) {
        return rentalRepository.findByClientId(clientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getProviderRentals(UUID providerId) {
        java.util.Set<UUID> providerToolIds = toolRepository.findByProviderId(providerId).stream()
                .map(Tool::getId)
                .collect(Collectors.toSet());

        if (providerToolIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        return rentalRepository.findAll().stream()
                .filter(rental -> rental.getItems().stream()
                        .anyMatch(item -> providerToolIds.contains(item.getToolId())))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse checkToolAvailability(
            UUID toolId, java.time.LocalDate from, java.time.LocalDate to) {
        Tool tool = toolRepository.findById(toolId)
                .orElseThrow(() -> new EntityNotFoundException("Tool", toolId));

        // Obtener todas las unidades físicas registradas para este mismo equipo/modelo y proveedor
        List<Tool> providerTools = toolRepository.findByProviderId(tool.getProviderId());
        List<Tool> allUnits = new ArrayList<>();
        if (providerTools != null && !providerTools.isEmpty()) {
            allUnits = providerTools.stream()
                    .filter(t -> t.getName() != null && t.getName().trim().equalsIgnoreCase(tool.getName().trim()))
                    .filter(t -> t.getStatus() != ToolStatus.RETIRED)
                    .collect(Collectors.toList());
        }
        if (allUnits.isEmpty() || allUnits.stream().noneMatch(u -> u.getId().equals(tool.getId()))) {
            allUnits = new ArrayList<>(allUnits);
            if (tool.getStatus() != ToolStatus.RETIRED && allUnits.stream().noneMatch(u -> u.getId().equals(tool.getId()))) {
                allUnits.add(tool);
            }
        }

        java.util.Set<UUID> unitIds = allUnits.stream().map(Tool::getId).collect(Collectors.toSet());

        List<Rental> activeRentals = rentalRepository.findAll().stream()
                .filter(r -> r.getStatus() == RentalStatus.PENDING || 
                             r.getStatus() == RentalStatus.CONFIRMED || 
                             r.getStatus() == RentalStatus.IN_PROGRESS)
                .filter(r -> r.getItems().stream().anyMatch(item -> unitIds.contains(item.getToolId())))
                .collect(Collectors.toList());

        List<Tool> availableUnits = new ArrayList<>();
        List<Tool> reservedUnits = new ArrayList<>();

        if (from != null && to != null) {
            DateRange queryRange = new DateRange(from, to);
            for (Tool unit : allUnits) {
                if (unit.getStatus() == ToolStatus.MAINTENANCE) {
                    continue; // En taller / mantenimiento preventivo
                }
                boolean overlaps = activeRentals.stream()
                        .filter(r -> r.getItems().stream().anyMatch(item -> item.getToolId().equals(unit.getId())))
                        .anyMatch(r -> r.getDateRange().overlaps(queryRange));

                if (overlaps) {
                    reservedUnits.add(unit);
                } else {
                    availableUnits.add(unit);
                }
            }
        } else {
            for (Tool unit : allUnits) {
                if (unit.getStatus() == ToolStatus.AVAILABLE) {
                    availableUnits.add(unit);
                } else {
                    reservedUnits.add(unit);
                }
            }
        }

        int totalStock = allUnits.size();
        int availableStock = availableUnits.size();
        int reservedStock = reservedUnits.size();
        boolean isAvailable = availableStock > 0;
        List<UUID> availableToolIds = availableUnits.stream().map(Tool::getId).collect(Collectors.toList());

        List<com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse.DateRangeDto> bookedRanges = activeRentals.stream()
                .map(r -> new com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse.DateRangeDto(
                        r.getDateRange().getStartDate(),
                        r.getDateRange().getEndDate()
                ))
                .distinct()
                .collect(Collectors.toList());

        String message;
        if (tool.getStatus() == ToolStatus.MAINTENANCE || tool.getStatus() == ToolStatus.RETIRED) {
            message = "Herramienta fuera de servicio (" + tool.getStatus() + ")";
        } else if (availableStock == totalStock) {
            message = "Stock completo disponible (" + totalStock + " " + (totalStock == 1 ? "unidad" : "unidades") + " listas para entrega inmediata)";
        } else if (availableStock > 0) {
            message = availableStock + " de " + totalStock + " unidades disponibles (" + reservedStock + " reservada" + (reservedStock > 1 ? "s" : "") + " por otros usuarios para este período)";
        } else {
            message = "Sin stock para estas fechas: las " + totalStock + " unidades se encuentran reservadas por otros usuarios";
        }

        return new com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse(
                tool.getId(),
                tool.getName(),
                isAvailable,
                tool.getStatus().name(),
                totalStock,
                availableStock,
                reservedStock,
                availableToolIds,
                from,
                to,
                bookedRanges,
                message
        );
    }

    @Transactional(readOnly = true)
    public List<com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse> checkCatalogAvailability(
            java.time.LocalDate from, java.time.LocalDate to) {
        List<Tool> allTools = toolRepository.findAll();
        if (allTools == null || allTools.isEmpty()) {
            return List.of();
        }

        // Agrupar herramientas por clave única de modelo (providerId + nombre del equipo)
        java.util.Map<String, Tool> primaryToolByModel = new java.util.LinkedHashMap<>();
        for (Tool t : allTools) {
            if (t.getStatus() == ToolStatus.RETIRED) continue;
            String key = t.getProviderId() + ":::" + (t.getName() != null ? t.getName().trim().toLowerCase() : "");
            primaryToolByModel.putIfAbsent(key, t);
        }

        List<com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse> responses = new ArrayList<>();
        for (Tool primary : primaryToolByModel.values()) {
            responses.add(checkToolAvailability(primary.getId(), from, to));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public RentalResponse getRentalById(UUID id) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rental", id));
        return mapToResponse(rental);
    }

    @Transactional
    public RentalResponse confirmRental(UUID id) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rental", id));
        rental.confirm();
        Rental saved = rentalRepository.save(rental);
        return mapToResponse(saved);
    }

    @Transactional
    public RentalResponse cancelRental(UUID id) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rental", id));
        rental.cancel();

        for (RentalItem item : rental.getItems()) {
            toolRepository.findById(item.getToolId()).ifPresent(tool -> {
                if (tool.getStatus() == ToolStatus.RENTED) {
                    tool.updateStatus(ToolStatus.AVAILABLE);
                    toolRepository.save(tool);
                }
            });
        }

        Rental saved = rentalRepository.save(rental);
        return mapToResponse(saved);
    }

    @Transactional
    public RentalResponse startRental(UUID id) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rental", id));
        rental.start();

        for (RentalItem item : rental.getItems()) {
            toolRepository.findById(item.getToolId()).ifPresent(tool -> {
                tool.updateStatus(ToolStatus.RENTED);
                toolRepository.save(tool);
            });
        }

        Rental saved = rentalRepository.save(rental);
        return mapToResponse(saved);
    }

    @Transactional
    public RentalResponse completeRental(UUID id) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rental", id));
        rental.complete();

        for (RentalItem item : rental.getItems()) {
            toolRepository.findById(item.getToolId()).ifPresent(tool -> {
                // Solo restaurar a AVAILABLE si la herramienta estaba RENTED.
                // Si la inspección previa detectó daños y la envió a MAINTENANCE o RETIRED, se respeta ese estado.
                if (tool.getStatus() == ToolStatus.RENTED) {
                    tool.updateStatus(ToolStatus.AVAILABLE);
                    toolRepository.save(tool);
                }
            });
        }

        Rental saved = rentalRepository.save(rental);
        return mapToResponse(saved);
    }

    private RentalResponse mapToResponse(Rental rental) {
        List<RentalResponse.RentalItemResponse> itemResponses = rental.getItems().stream()
                .map(item -> new RentalResponse.RentalItemResponse(
                        item.getId(),
                        item.getToolId(),
                        item.getDailyPrice().getAmount(),
                        item.getTotalPrice().getAmount(),
                        item.getStatus().name()
                ))
                .collect(Collectors.toList());

        return new RentalResponse(
                rental.getId(),
                rental.getRentalCode(),
                rental.getClientId(),
                rental.getDateRange().getStartDate(),
                rental.getDateRange().getEndDate(),
                rental.getTotalDays(),
                rental.getSubtotal().getAmount(),
                rental.getDeposit().getAmount(),
                rental.getTotalAmount().getAmount(),
                rental.getStatus().name(),
                itemResponses
        );
    }
}
