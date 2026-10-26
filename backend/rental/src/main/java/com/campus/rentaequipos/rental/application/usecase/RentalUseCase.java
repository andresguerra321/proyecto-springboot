package com.campus.rentaequipos.rental.application.usecase;

import com.campus.rentaequipos.catalog.domain.model.Tool;
import com.campus.rentaequipos.catalog.domain.model.ToolStatus;
import com.campus.rentaequipos.catalog.domain.repository.ToolRepository;
import com.campus.rentaequipos.rental.application.dto.LateFeeResponse;
import com.campus.rentaequipos.rental.application.dto.RentalRequest;
import com.campus.rentaequipos.shared.domain.exception.HerramientaNoDisponibleException;
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
import com.campus.rentaequipos.rental.application.dto.ProviderRentalSummaryResponse;
import com.campus.rentaequipos.rental.application.dto.RentalStatusHistoryResponse;
import com.campus.rentaequipos.rental.domain.model.RentalStatusHistory;
import com.campus.rentaequipos.rental.domain.repository.RentalStatusHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RentalUseCase {

    /** Máximo de reservas activas (PENDING/CONFIRMED/IN_PROGRESS) por cliente. */
    public static final int MAX_ACTIVE_RENTALS_PER_CLIENT = 3;
    /** Factor de recargo por mora sobre la tarifa diaria. */
    public static final BigDecimal LATE_PENALTY_FACTOR = new BigDecimal("1.5");

    /** Descuento escalonado por duración: 7-14 días = 10%, 15+ días = 20%. */
    public static BigDecimal durationDiscountFactor(int totalDays) {
        if (totalDays >= 15) return new BigDecimal("0.80");
        if (totalDays >= 7) return new BigDecimal("0.90");
        return BigDecimal.ONE;
    }

    private static boolean isActive(RentalStatus s) {
        return s == RentalStatus.PENDING || s == RentalStatus.CONFIRMED || s == RentalStatus.IN_PROGRESS;
    }

    private final RentalRepository rentalRepository;
    private final ToolRepository toolRepository;
    private final RentalStatusHistoryRepository statusHistoryRepository;

    @Autowired
    public RentalUseCase(RentalRepository rentalRepository, ToolRepository toolRepository, RentalStatusHistoryRepository statusHistoryRepository) {
        this.rentalRepository = rentalRepository;
        this.toolRepository = toolRepository;
        this.statusHistoryRepository = statusHistoryRepository;
    }

    public RentalUseCase(RentalRepository rentalRepository, ToolRepository toolRepository) {
        this(rentalRepository, toolRepository, null);
    }

    private void recordHistory(UUID rentalId, String fromStatus, String toStatus, String changedBy, String notes) {
        if (statusHistoryRepository != null && rentalId != null) {
            try {
                RentalStatusHistory history = new RentalStatusHistory(
                        rentalId,
                        fromStatus,
                        toStatus,
                        changedBy != null ? changedBy : "SYSTEM",
                        notes
                );
                statusHistoryRepository.save(history);
            } catch (Exception e) {
                // Ignore history failure to prevent aborting transaction
            }
        }
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

        long activeForClient = rentalRepository.findByClientId(request.clientId()).stream()
                .filter(r -> isActive(r.getStatus()))
                .count();
        if (activeForClient >= MAX_ACTIVE_RENTALS_PER_CLIENT) {
            throw new BusinessRuleViolationException("El cliente ha alcanzado el límite de " + MAX_ACTIVE_RENTALS_PER_CLIENT + " alquileres activos simultáneos.");
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
            Money itemTotal = dailyPrice.multiply(totalDays).multiply(durationDiscountFactor(totalDays));
            
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
                items,
                request.deliveryAddress(),
                request.contactPhone()
        );

        Rental savedRental = rentalRepository.save(rental);
        recordHistory(savedRental.getId(), null, "PENDING", "CLIENT", "Creación de reserva");
        return mapToResponse(savedRental);
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getAllRentals() {
        return rentalRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /** Filtro opcional por estado, rango de fechas y/o proveedor. */
    @Transactional(readOnly = true)
    public List<RentalResponse> searchRentals(String status, java.time.LocalDate from, java.time.LocalDate to, UUID providerId) {
        RentalStatus st = null;
        if (status != null && !status.isBlank()) {
            try {
                st = RentalStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessRuleViolationException("Estado inválido: " + status);
            }
        }
        final RentalStatus filterStatus = st;
        final java.util.Set<UUID> providerToolIds = (providerId != null)
                ? toolRepository.findByProviderId(providerId).stream().map(Tool::getId).collect(Collectors.toSet())
                : null;

        return rentalRepository.findAll().stream()
                .filter(r -> filterStatus == null || r.getStatus() == filterStatus)
                .filter(r -> from == null || !r.getDateRange().getEndDate().isBefore(from))
                .filter(r -> to == null || !r.getDateRange().getStartDate().isAfter(to))
                .filter(r -> providerToolIds == null || r.getItems().stream().anyMatch(i -> providerToolIds.contains(i.getToolId())))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> searchRentals(String status, java.time.LocalDate from, java.time.LocalDate to) {
        return searchRentals(status, from, to, null);
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getClientRentals(UUID clientId) {
        return rentalRepository.findByClientId(clientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getProviderRentals(UUID providerId) {
        return getProviderRentals(providerId, null);
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> getProviderRentals(UUID providerId, String status) {
        java.util.Set<UUID> providerToolIds = toolRepository.findByProviderId(providerId).stream()
                .map(Tool::getId)
                .collect(Collectors.toSet());

        if (providerToolIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        RentalStatus st = null;
        if (status != null && !status.isBlank()) {
            try {
                st = RentalStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessRuleViolationException("Estado inválido: " + status);
            }
        }
        final RentalStatus filterStatus = st;

        return rentalRepository.findAll().stream()
                .filter(r -> filterStatus == null || r.getStatus() == filterStatus)
                .filter(rental -> rental.getItems().stream()
                        .anyMatch(item -> providerToolIds.contains(item.getToolId())))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProviderRentalSummaryResponse getProviderSummary(UUID providerId) {
        List<RentalResponse> rentals = getProviderRentals(providerId, null);
        long total = rentals.size();
        Map<String, Long> countByStatus = rentals.stream()
                .collect(Collectors.groupingBy(RentalResponse::status, Collectors.counting()));
        BigDecimal totalCompletedIncome = rentals.stream()
                .filter(r -> "COMPLETED".equalsIgnoreCase(r.status()))
                .map(RentalResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ProviderRentalSummaryResponse(providerId, total, countByStatus, totalCompletedIncome);
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
            java.time.LocalDate today = java.time.LocalDate.now();
            DateRange todayRange = new DateRange(today, today);
            for (Tool unit : allUnits) {
                if (unit.getStatus() == ToolStatus.MAINTENANCE || unit.getStatus() == ToolStatus.RETIRED) {
                    reservedUnits.add(unit);
                    continue;
                }
                boolean overlapsToday = activeRentals.stream()
                        .filter(r -> r.getItems().stream().anyMatch(item -> item.getToolId().equals(unit.getId())))
                        .anyMatch(r -> r.getDateRange().overlaps(todayRange));

                if (overlapsToday || unit.getStatus() == ToolStatus.RENTED) {
                    reservedUnits.add(unit);
                } else {
                    availableUnits.add(unit);
                }
            }
        }

        int totalStock = allUnits.size();
        int availableStock = availableUnits.size();
        int reservedStock = reservedUnits.size();
        boolean isAvailable = availableStock > 0;
        List<UUID> availableToolIds = availableUnits.stream().map(Tool::getId).collect(Collectors.toList());

        // Un rango de fechas solo se considera "bloqueado / no disponible" en el calendario
        // si TODAS las unidades operativas de este modelo se encuentran ocupadas simultáneamente.
        // Si hay 2 unidades y una está ocupada pero la otra libre, el equipo NO se bloquea
        // porque aún hay inventario libre para reservar.
        List<Tool> operationalUnits = allUnits.stream()
                .filter(u -> u.getStatus() != ToolStatus.MAINTENANCE && u.getStatus() != ToolStatus.RETIRED)
                .collect(Collectors.toList());
        int totalOperational = operationalUnits.size();

        List<com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse.DateRangeDto> bookedRanges = new ArrayList<>();
        if (totalOperational > 0 && !activeRentals.isEmpty()) {
            java.time.LocalDate minStart = null;
            java.time.LocalDate maxEnd = null;
            for (Rental r : activeRentals) {
                if (minStart == null || r.getDateRange().getStartDate().isBefore(minStart)) {
                    minStart = r.getDateRange().getStartDate();
                }
                if (maxEnd == null || r.getDateRange().getEndDate().isAfter(maxEnd)) {
                    maxEnd = r.getDateRange().getEndDate();
                }
            }

            java.time.LocalDate horizonLimit = java.time.LocalDate.now().plusDays(365);
            if (minStart != null && maxEnd != null) {
                if (maxEnd.isAfter(horizonLimit)) {
                    maxEnd = horizonLimit;
                }
                java.time.LocalDate rangeStart = null;
                java.time.LocalDate cur = minStart;
                while (!cur.isAfter(maxEnd)) {
                    final java.time.LocalDate day = cur;
                    long rentedUnitsCount = operationalUnits.stream()
                            .filter(unit -> activeRentals.stream()
                                    .filter(r -> r.getItems().stream().anyMatch(item -> item.getToolId().equals(unit.getId())))
                                    .anyMatch(r -> !day.isBefore(r.getDateRange().getStartDate()) && !day.isAfter(r.getDateRange().getEndDate()))
                            ).count();

                    boolean fullyBooked = (rentedUnitsCount >= totalOperational);
                    if (fullyBooked) {
                        if (rangeStart == null) {
                            rangeStart = day;
                        }
                    } else {
                        if (rangeStart != null) {
                            bookedRanges.add(new com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse.DateRangeDto(
                                    rangeStart, day.minusDays(1)
                            ));
                            rangeStart = null;
                        }
                    }
                    cur = cur.plusDays(1);
                }
                if (rangeStart != null) {
                    bookedRanges.add(new com.campus.rentaequipos.rental.application.dto.ToolAvailabilityResponse.DateRangeDto(
                            rangeStart, maxEnd
                    ));
                }
            }
        }

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

    // ===================== EXAMEN: APROBAR / RECHAZAR =====================

    @Transactional
    public RentalResponse aprobarReserva(UUID idReserva) {
        Rental rental = rentalRepository.findById(idReserva)
                .orElseThrow(() -> new EntityNotFoundException("Rental", idReserva));

        if (rental.getStatus() != RentalStatus.PENDING) {
            throw new BusinessRuleViolationException("Solo se pueden aprobar reservas PENDIENTES (estado actual: " + rental.getStatus() + ").");
        }

        // La herramienta debe seguir disponible: operativa y sin otra reserva APROBADA/EN CURSO que se cruce.
        List<Rental> others = rentalRepository.findAll().stream()
                .filter(r -> !r.getId().equals(rental.getId()))
                .filter(r -> r.getStatus() == RentalStatus.CONFIRMED || r.getStatus() == RentalStatus.IN_PROGRESS)
                .collect(Collectors.toList());

        for (RentalItem item : rental.getItems()) {
            Tool tool = toolRepository.findById(item.getToolId())
                    .orElseThrow(() -> new EntityNotFoundException("Tool", item.getToolId()));
            if (tool.getStatus() == ToolStatus.MAINTENANCE || tool.getStatus() == ToolStatus.RETIRED) {
                throw new HerramientaNoDisponibleException(tool.getName(), "está fuera de servicio (" + tool.getStatus() + ")");
            }
            boolean overlap = others.stream()
                    .filter(r -> r.getItems().stream().anyMatch(i -> i.getToolId().equals(item.getToolId())))
                    .anyMatch(r -> r.getDateRange().overlaps(rental.getDateRange()));
            if (overlap) {
                throw new HerramientaNoDisponibleException(tool.getName(), "ya tiene otra reserva aprobada en esas fechas");
            }
        }

        rental.confirm();
        Rental saved = rentalRepository.save(rental);
        recordHistory(saved.getId(), "PENDING", "CONFIRMED", "SYSTEM", "Reserva aprobada");

        // Auto-rechazo de otras reservas PENDING que compitan por las mismas herramientas en fechas que se crucen
        List<Rental> pendingConflicts = rentalRepository.findAll().stream()
                .filter(r -> !r.getId().equals(saved.getId()))
                .filter(r -> r.getStatus() == RentalStatus.PENDING)
                .filter(r -> r.getItems().stream().anyMatch(i ->
                        saved.getItems().stream().anyMatch(si -> si.getToolId().equals(i.getToolId()))))
                .filter(r -> r.getDateRange().overlaps(saved.getDateRange()))
                .collect(Collectors.toList());

        for (Rental conflict : pendingConflicts) {
            String autoRejectReason = "Rechazo automático: conflicto de fechas con reserva aprobada " + saved.getRentalCode();
            conflict.reject(autoRejectReason);
            rentalRepository.save(conflict);
            recordHistory(conflict.getId(), "PENDING", "REJECTED", "SYSTEM", autoRejectReason);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public RentalResponse rechazarReserva(UUID idReserva) {
        return rechazarReserva(idReserva, null);
    }

    @Transactional
    public RentalResponse rechazarReserva(UUID idReserva, String reason) {
        Rental rental = rentalRepository.findById(idReserva)
                .orElseThrow(() -> new EntityNotFoundException("Rental", idReserva));

        if (rental.getStatus() != RentalStatus.PENDING) {
            throw new BusinessRuleViolationException("Solo se pueden rechazar reservas PENDIENTES (estado actual: " + rental.getStatus() + ").");
        }
        rental.reject(reason);
        Rental saved = rentalRepository.save(rental);
        recordHistory(saved.getId(), "PENDING", "REJECTED", "SYSTEM", reason != null && !reason.isBlank() ? reason : "Reserva rechazada");
        return mapToResponse(saved);
    }

    // ===================== EXTENSIÓN DE ALQUILER =====================

    @Transactional
    public RentalResponse extendRental(UUID id, java.time.LocalDate newEndDate) {
        if (newEndDate == null) {
            throw new BusinessRuleViolationException("Debe indicar la nueva fecha fin (newEndDate).");
        }
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rental", id));

        if (rental.getStatus() != RentalStatus.CONFIRMED && rental.getStatus() != RentalStatus.IN_PROGRESS) {
            throw new BusinessRuleViolationException("Solo se pueden extender reservas CONFIRMED o IN_PROGRESS.");
        }
        java.time.LocalDate currentEnd = rental.getDateRange().getEndDate();
        if (!newEndDate.isAfter(currentEnd)) {
            throw new BusinessRuleViolationException("La nueva fecha fin debe ser posterior a " + currentEnd + ".");
        }

        DateRange newRange = new DateRange(rental.getDateRange().getStartDate(), newEndDate);
        int newDays = (int) newRange.getDays();
        if (newDays > 30) {
            throw new BusinessRuleViolationException("La duración total no puede superar 30 días (solicitado: " + newDays + ").");
        }

        // Solo el tramo adicional debe estar libre en otras reservas activas.
        DateRange extraRange = new DateRange(currentEnd.plusDays(1), newEndDate);
        List<Rental> others = rentalRepository.findAll().stream()
                .filter(r -> !r.getId().equals(rental.getId()))
                .filter(r -> isActive(r.getStatus()))
                .collect(Collectors.toList());
        for (RentalItem item : rental.getItems()) {
            boolean overlap = others.stream()
                    .filter(r -> r.getItems().stream().anyMatch(i -> i.getToolId().equals(item.getToolId())))
                    .anyMatch(r -> r.getDateRange().overlaps(extraRange));
            if (overlap) {
                String name = toolRepository.findById(item.getToolId()).map(Tool::getName).orElse(item.getToolId().toString());
                throw new HerramientaNoDisponibleException(name, "tiene otra reserva entre " + extraRange.getStartDate() + " y " + newEndDate);
            }
        }

        Money newSubtotal = Money.ZERO;
        BigDecimal factor = durationDiscountFactor(newDays);
        for (RentalItem item : rental.getItems()) {
            Money itemTotal = item.getDailyPrice().multiply(newDays).multiply(factor);
            item.updateTotalPrice(itemTotal);
            newSubtotal = newSubtotal.add(itemTotal);
        }

        rental.extend(newRange, newDays, newSubtotal);
        return mapToResponse(rentalRepository.save(rental));
    }

    // ===================== RECARGO POR MORA =====================

    @Transactional(readOnly = true)
    public LateFeeResponse calculateLateFee(UUID id) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rental", id));
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate end = rental.getDateRange().getEndDate();
        long daysOverdue = Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(end, today));
        if (rental.getStatus() != RentalStatus.IN_PROGRESS) {
            daysOverdue = 0; // solo hay mora si el equipo sigue en poder del cliente
        }
        Money dailySum = rental.getItems().stream()
                .map(RentalItem::getDailyPrice)
                .reduce(Money.ZERO, Money::add);
        Money fee = dailySum.multiply(daysOverdue).multiply(LATE_PENALTY_FACTOR);
        return new LateFeeResponse(rental.getId(), rental.getRentalCode(), end, today,
                daysOverdue, dailySum.getAmount(), LATE_PENALTY_FACTOR, fee.getAmount());
    }

    @Transactional
    public RentalResponse confirmRental(UUID id) {
        return aprobarReserva(id);
    }

    @Transactional
    public RentalResponse cancelRental(UUID id) {
        return cancelRental(id, false);
    }

    @Transactional
    public RentalResponse cancelRental(UUID id, boolean isClientCaller) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rental", id));

        RentalStatus prevStatus = rental.getStatus();
        try {
            if (isClientCaller) {
                rental.cancelByClient(java.time.LocalDateTime.now());
            } else {
                rental.cancel();
            }
        } catch (IllegalStateException e) {
            throw new BusinessRuleViolationException(e.getMessage());
        }

        for (RentalItem item : rental.getItems()) {
            toolRepository.findById(item.getToolId()).ifPresent(tool -> {
                if (tool.getStatus() == ToolStatus.RENTED) {
                    tool.updateStatus(ToolStatus.AVAILABLE);
                    toolRepository.save(tool);
                }
            });
        }

        Rental saved = rentalRepository.save(rental);
        recordHistory(saved.getId(), prevStatus.name(), "CANCELLED", isClientCaller ? "CLIENT" : "SYSTEM", "Cancelación de reserva");
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
        recordHistory(saved.getId(), "CONFIRMED", "IN_PROGRESS", "SYSTEM", "Entrega de equipos");
        return mapToResponse(saved);
    }

    @Transactional
    public RentalResponse completeRental(UUID id) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rental", id));

        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate endDate = rental.getDateRange().getEndDate();
        if (today.isAfter(endDate)) {
            long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(endDate, today);
            Money dailySum = rental.getItems().stream()
                    .map(RentalItem::getDailyPrice)
                    .reduce(Money.ZERO, Money::add);
            Money lateFee = dailySum.multiply(daysOverdue).multiply(LATE_PENALTY_FACTOR);
            rental.complete(lateFee);
        } else {
            rental.complete();
        }

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
        recordHistory(saved.getId(), "IN_PROGRESS", "COMPLETED", "SYSTEM", "Devolución de equipos");
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RentalStatusHistoryResponse> getRentalHistory(UUID rentalId) {
        if (statusHistoryRepository == null) {
            return List.of();
        }
        return statusHistoryRepository.findByRentalId(rentalId).stream()
                .map(RentalStatusHistoryResponse::fromDomain)
                .collect(Collectors.toList());
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
                itemResponses,
                rental.getDeliveryAddress(),
                rental.getContactPhone(),
                rental.getRejectionReason()
        );
    }
}
