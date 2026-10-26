package com.campus.rentaequipos.rental.domain.model;

import com.campus.rentaequipos.shared.domain.valueobject.DateRange;
import com.campus.rentaequipos.shared.domain.valueobject.Money;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Rental {
    private UUID id;
    private String rentalCode;
    private UUID clientId;
    private DateRange dateRange;
    private int totalDays;
    private Money subtotal;
    private Money deposit;
    private Money totalAmount;
    private RentalStatus status;
    private List<RentalItem> items;
    private String deliveryAddress;
    private String contactPhone;

    public Rental(UUID id, String rentalCode, UUID clientId, DateRange dateRange, int totalDays, 
                  Money subtotal, Money deposit, Money totalAmount, RentalStatus status, List<RentalItem> items) {
        this(id, rentalCode, clientId, dateRange, totalDays, subtotal, deposit, totalAmount, status, items, null, null);
    }

    public Rental(UUID id, String rentalCode, UUID clientId, DateRange dateRange, int totalDays, 
                  Money subtotal, Money deposit, Money totalAmount, RentalStatus status, List<RentalItem> items,
                  String deliveryAddress, String contactPhone) {
        this.id = id;
        this.rentalCode = rentalCode;
        this.clientId = clientId;
        this.dateRange = dateRange;
        this.totalDays = totalDays;
        this.subtotal = subtotal;
        this.deposit = deposit;
        this.totalAmount = totalAmount;
        this.status = status != null ? status : RentalStatus.PENDING;
        this.items = items != null ? items : new ArrayList<>();
        this.deliveryAddress = deliveryAddress;
        this.contactPhone = contactPhone;
    }

    public void confirm() {
        if (this.status == RentalStatus.CONFIRMED) {
            return;
        }
        if (this.status != RentalStatus.PENDING) {
            throw new IllegalStateException("Solo se pueden confirmar reservas en estado PENDING");
        }
        this.status = RentalStatus.CONFIRMED;
    }

    public void cancel() {
        if (this.status == RentalStatus.COMPLETED || this.status == RentalStatus.IN_PROGRESS) {
            throw new IllegalStateException("No se pueden cancelar reservas en curso o completadas");
        }
        this.status = RentalStatus.CANCELLED;
    }

    /** Cancelación por parte del cliente: exige al menos 24 horas de anticipación a la fecha de inicio. */
    public void cancelByClient(java.time.LocalDateTime cancellationTime) {
        if (this.status == RentalStatus.COMPLETED || this.status == RentalStatus.IN_PROGRESS) {
            throw new IllegalStateException("No se pueden cancelar reservas en curso o completadas");
        }
        java.time.LocalDateTime cutoff = this.dateRange.getStartDate().atStartOfDay().minusHours(24);
        if (cancellationTime != null && cancellationTime.isAfter(cutoff)) {
            throw new IllegalStateException("El cliente solo puede cancelar con más de 24 horas de anticipación a la fecha de inicio (" + this.dateRange.getStartDate() + ")");
        }
        this.status = RentalStatus.CANCELLED;
    }

    public void start() {
        if (this.status != RentalStatus.CONFIRMED) {
            throw new IllegalStateException("Solo se pueden iniciar reservas en estado CONFIRMED");
        }
        this.status = RentalStatus.IN_PROGRESS;
    }

    public void complete() {
        complete(Money.ZERO);
    }

    public void complete(Money lateFee) {
        if (this.status != RentalStatus.IN_PROGRESS && this.status != RentalStatus.CONFIRMED) {
            throw new IllegalStateException("Solo se pueden completar reservas en estado IN_PROGRESS o CONFIRMED");
        }
        this.status = RentalStatus.COMPLETED;
        if (lateFee != null && lateFee.isGreaterThan(Money.ZERO)) {
            this.totalAmount = this.totalAmount.add(lateFee);
        }
    }

    /** Rechazo por parte del proveedor: solo válido para reservas PENDIENTES. */
    public void reject() {
        if (this.status != RentalStatus.PENDING) {
            throw new IllegalStateException("Solo se pueden rechazar reservas en estado PENDING (actual: " + this.status + ")");
        }
        this.status = RentalStatus.REJECTED;
    }

    /** Extiende la fecha fin recalculando días, subtotal y total. */
    public void extend(DateRange newRange, int newTotalDays, Money newSubtotal) {
        if (this.status != RentalStatus.CONFIRMED && this.status != RentalStatus.IN_PROGRESS) {
            throw new IllegalStateException("Solo se pueden extender reservas CONFIRMED o IN_PROGRESS (actual: " + this.status + ")");
        }
        if (!newRange.getEndDate().isAfter(this.dateRange.getEndDate())) {
            throw new IllegalArgumentException("La nueva fecha fin debe ser posterior a la actual (" + this.dateRange.getEndDate() + ")");
        }
        this.dateRange = newRange;
        this.totalDays = newTotalDays;
        this.subtotal = newSubtotal;
        this.totalAmount = newSubtotal.add(this.deposit);
    }

    // Getters
    public UUID getId() { return id; }
    public String getRentalCode() { return rentalCode; }
    public UUID getClientId() { return clientId; }
    public DateRange getDateRange() { return dateRange; }
    public int getTotalDays() { return totalDays; }
    public Money getSubtotal() { return subtotal; }
    public Money getDeposit() { return deposit; }
    public Money getTotalAmount() { return totalAmount; }
    public RentalStatus getStatus() { return status; }
    public List<RentalItem> getItems() { return items; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public String getContactPhone() { return contactPhone; }
}
